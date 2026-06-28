"""
Authentication service — OAuth 2.0 PKCE flow with Microsoft Entra ID.

SECURITY MODEL
--------------
The application enforces a strict identity model:

  URL slug   — a human-readable identifier used only for routing.
               It is NOT a security credential. It can be guessed or shared.
               Knowing the slug provides zero access to the page.

  Email      — the authoritative identity claim, extracted from a cryptographically
               verified Microsoft Entra ID token. It cannot be forged.

The access decision at callback time:
  IF  (microsoft_verified_email == recipient.email)  →  grant RECIPIENT access
  ELIF (microsoft_verified_email in admin_set)        →  grant ADMIN access
  ELSE                                                →  deny with 403

Every branch of this decision is logged to access_attempts with an HMAC-hashed
IP (privacy-preserving audit trail, not raw PII).

INFORMATION LEAKAGE PREVENTION
--------------------------------
The application NEVER reveals whether a given slug corresponds to an existing page
to an unauthenticated or incorrectly-authenticated user:

  - /auth/login?slug=X  redirects to Microsoft regardless of whether X exists.
    An attacker observing only HTTP responses cannot distinguish a real slug from
    a made-up one without completing a full Microsoft OAuth round-trip.

  - /auth/callback raises IdentityMismatchError (403) regardless of whether:
      a) The slug exists but the email doesn't match, or
      b) The slug doesn't exist at all.
    Both cases present the same HTTP 403 response with the same error body.

REPLAY ATTACK PREVENTION
-------------------------
  1. PKCE S256 — the authorization code cannot be exchanged without the
     code_verifier, which lives only in the oauth_states DB row. An intercepted
     code is useless without it.

  2. OAuthState one-time use — mark_used() is called before any other work in
     handle_callback(). A replayed callback request will fail with OAuthError
     because the state record is already marked used.

  3. Nonce — the ID token nonce is verified against the stored value. An attacker
     who obtained a valid ID token from a different application or request cannot
     replay it here.

  4. 10-minute state TTL — the oauth_states record expires. Slow replays fail.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.exceptions import (
    IdentityMismatchError,
    InvalidTokenError,
    OAuthError,
    TokenExpiredError,
)
from app.core.log import get_logger
from app.core.security import (
    create_access_token,
    extract_email_from_claims,
    generate_pkce_pair,
    validate_microsoft_id_token,
)
from app.domain.enums import UserRole
from app.infrastructure.models.audit import AccessAttempt, OAuthState
from app.infrastructure.repositories.guestbook import OAuthStateRepository
from app.infrastructure.repositories.recipient import RecipientRepository
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)

# ── In-process JWKS cache ─────────────────────────────────────────────────────
# WHY IN-PROCESS: Microsoft rotates their signing keys roughly every 24 hours.
# Fetching JWKS on every callback would add ~100-300ms of latency. We cache for
# 1 hour (well below rotation interval) and refresh on a kid miss.
_jwks_cache: dict[str, Any] = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # 1 hour


async def _get_microsoft_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at

    if not force_refresh and _jwks_cache and (time.monotonic() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(settings.MICROSOFT_JWKS_URL)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_fetched_at = time.monotonic()

    logger.info("Microsoft JWKS refreshed")
    return _jwks_cache


# ── Auth service ──────────────────────────────────────────────────────────────

class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._recipient_repo = RecipientRepository(session)
        self._oauth_state_repo = OAuthStateRepository(session)

    async def initiate_login(self, slug: str) -> str:
        """
        Create a PKCE pair, persist the state, and return the Microsoft auth URL.

        SECURITY DECISION — NO SLUG EXISTENCE CHECK HERE
        --------------------------------------------------
        We deliberately do NOT look up whether `slug` exists in the database.

        If we did, an attacker could send GET /auth/login?slug=alice-chen-2024
        and observe:
          302 redirect to Microsoft  →  slug exists
          404 Not Found              →  slug doesn't exist

        This would let them enumerate all valid slugs without ever authenticating.
        By always redirecting to Microsoft regardless of slug validity, we force
        any enumeration attempt to complete a full OAuth round-trip per probe —
        computationally and logistically impractical at scale.

        The slug existence check is deferred to handle_callback(), which raises
        the same IdentityMismatchError (403) whether the slug doesn't exist or
        the email doesn't match.
        """
        code_verifier, code_challenge = generate_pkce_pair()
        nonce       = secrets.token_hex(16)   # 128-bit random nonce for ID token binding
        state_token = secrets.token_urlsafe(32)  # 256-bit CSRF state token

        # Store the PKCE verifier + nonce server-side. The state_token is the key
        # that ties the callback request back to this record. It is single-use and
        # expires in 10 minutes regardless of whether it is used.
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        oauth_state = OAuthState(
            state_token=state_token,
            slug=slug,
            code_verifier=code_verifier,
            nonce=nonce,
            expires_at=expires_at,
        )
        self._session.add(oauth_state)
        await self._session.flush()

        params = {
            "client_id":             settings.AZURE_CLIENT_ID,
            "response_type":         "code",
            "redirect_uri":          settings.OAUTH_REDIRECT_URI,
            "scope":                 "openid email profile",
            "state":                 state_token,
            "code_challenge":        code_challenge,
            "code_challenge_method": "S256",
            "nonce":                 nonce,
            "response_mode":         "query",
            # prompt=select_account forces the Microsoft login picker.
            # Without this, a shared-computer user might silently log in as the
            # previously-cached account, which would cause an unexpected 403.
            "prompt":                "select_account",
        }
        auth_url = f"{settings.MICROSOFT_AUTH_URL}?{urlencode(params)}"
        logger.info("OAuth flow initiated", extra={"slug": slug})
        return auth_url

    async def handle_callback(
        self,
        code: str,
        state_token: str,
        request_ip: str,
        user_agent: str,
    ) -> str:
        """
        Validate state, exchange code for tokens, enforce identity match,
        and return a signed application JWT.

        This method is the authoritative access control enforcement point.
        It runs AFTER the user has authenticated with Microsoft. Its job is to
        decide whether the authenticated identity is allowed to see the page.
        """

        # Step 1 — Consume the state record (replay prevention)
        # -----------------------------------------------------------------
        # get_by_state_token filters: state_token match + used=False + not expired.
        # mark_used() sets used=True atomically before we do any other work.
        # A replayed callback with the same state token will find no record.
        oauth_state = await self._oauth_state_repo.get_by_state_token(state_token)
        if not oauth_state:
            raise OAuthError(
                "Invalid, expired, or already-used OAuth state token. "
                "If you followed an old link, please click the login button again."
            )

        await self._oauth_state_repo.mark_used(oauth_state)
        slug          = oauth_state.slug
        nonce         = oauth_state.nonce
        code_verifier = oauth_state.code_verifier

        # Step 2 — Exchange authorization code for Microsoft tokens (PKCE)
        # -----------------------------------------------------------------
        # We send code_verifier alongside the code. Microsoft verifies that
        # SHA-256(code_verifier) == the code_challenge we sent at /login.
        # An intercepted code is useless without the verifier.
        try:
            tokens = await self._exchange_code(code, code_verifier)
        except Exception as exc:
            logger.warning("Token exchange failed", extra={"error": str(exc), "slug": slug})
            raise OAuthError(f"Token exchange with Microsoft failed: {exc}")

        id_token = tokens.get("id_token")
        if not id_token:
            raise OAuthError(
                "Microsoft did not return an ID token. "
                "Ensure the 'openid' scope is included in the authorization request."
            )

        # Step 3 — Validate the Microsoft ID token
        # -----------------------------------------------------------------
        # validate_microsoft_id_token checks: RS256 signature, audience, tenant,
        # nonce, and expiry. See security.py for the full explanation.
        # On a key miss (kid not in cache), force-refresh JWKS once and retry.
        try:
            jwks   = await _get_microsoft_jwks()
            claims = validate_microsoft_id_token(id_token, jwks, nonce)
        except InvalidTokenError as exc:
            if "No matching public key" in str(exc):
                # Microsoft may have rotated their signing keys since last cache.
                # Force a refresh and retry once before giving up.
                logger.info("kid not in JWKS cache, forcing refresh")
                jwks   = await _get_microsoft_jwks(force_refresh=True)
                claims = validate_microsoft_id_token(id_token, jwks, nonce)
            else:
                await self._log_attempt(
                    slug, None, None, "error", str(exc), request_ip, user_agent
                )
                raise

        # Step 4 — Extract and normalize the email from the verified token
        # -----------------------------------------------------------------
        # extract_email_from_claims cascades through email → preferred_username → upn.
        # The returned value is already lowercased and stripped.
        authenticated_email = extract_email_from_claims(claims)
        entra_oid           = claims.get("oid", "")
        display_name        = claims.get("name", authenticated_email)

        if not authenticated_email:
            await self._log_attempt(
                slug, None, None, "error", "no-email-in-token", request_ip, user_agent, entra_oid
            )
            raise OAuthError(
                "The Microsoft token did not contain a usable email address. "
                "Ensure the 'email' optional claim is enabled for this application in Entra."
            )

        # Step 5 — Look up the intended recipient for this slug
        # -----------------------------------------------------------------
        # SECURITY DECISION: If the slug doesn't exist, we raise IdentityMismatchError
        # (403), NOT NotFoundError (404).
        #
        # If we returned 404 for a missing slug and 403 for an email mismatch, an
        # attacker who can complete a Microsoft OAuth flow could learn whether a slug
        # is registered: 403 = "exists but you're not them", 404 = "doesn't exist".
        # By making both cases return the same 403, we prevent this inference.
        recipient = await self._recipient_repo.get_by_slug(slug)
        if not recipient:
            await self._log_attempt(
                slug, authenticated_email, None, "denied", "slug-not-found",
                request_ip, user_agent, entra_oid
            )
            raise IdentityMismatchError()  # Same error as email mismatch — no slug existence disclosure

        intended_email = recipient.email  # Already stored lowercase (normalized on create)

        # Step 6 — The identity check — this is the core authorization decision
        # -----------------------------------------------------------------
        # SECURITY DECISION: We compare lowercased emails.
        # authenticated_email is already lowercased (extract_email_from_claims).
        # intended_email is stored lowercase (RecipientService.create normalizes on write).
        # We lowercase both defensively in case a legacy record slipped through unnormalized.
        #
        # We do NOT use hmac.compare_digest here because email addresses are not
        # secret values — the attacker already knows their own email and the intended
        # email is the recipient's work address, not a cryptographic secret. Timing
        # safety matters for secrets; plain equality is appropriate here.
        auth_email_norm    = authenticated_email.lower().strip()
        intended_email_norm = intended_email.lower().strip()

        if auth_email_norm == intended_email_norm:
            role         = UserRole.RECIPIENT
            recipient_id = recipient.id
            issued_slug  = slug   # Carry slug into JWT so the router knows where to redirect
            outcome      = "granted"
            denial_reason = None

        elif auth_email_norm in settings.admin_email_set:
            role          = UserRole.ADMIN
            recipient_id  = None
            issued_slug   = None  # Admins go to /admin, not /to/[slug]
            outcome       = "granted"
            denial_reason = None

        else:
            # SECURITY DECISION: All other authenticated identities are denied.
            # This includes legitimate colleagues. The page is private to the
            # recipient + admins. The guestbook (a future feature) would use a
            # separate, colleague-specific flow.
            #
            # We log the denial, then raise IdentityMismatchError (403).
            # The error message does NOT reveal the intended email — it only
            # says "does not match". This prevents the error from being used
            # to discover what email the page was created for.
            role          = None
            recipient_id  = None
            issued_slug   = None
            outcome       = "denied"
            denial_reason = "identity-mismatch"

        await self._log_attempt(
            slug, authenticated_email, intended_email, outcome,
            denial_reason, request_ip, user_agent, entra_oid
        )

        if outcome == "denied":
            raise IdentityMismatchError()

        # Step 7 — Issue the application JWT
        # -----------------------------------------------------------------
        assert role is not None  # mypy: we only reach here if outcome == "granted"
        access_token = create_access_token(
            subject=authenticated_email,
            email=authenticated_email,
            name=display_name,
            role=role,
            entra_oid=entra_oid,
            recipient_id=recipient_id,
            slug=issued_slug,
        )

        logger.info(
            "Login granted",
            extra={"role": role, "slug": slug},
            # Never log the email in info-level logs — it's PII.
            # The access_attempts table holds the full audit trail.
        )
        return access_token

    async def _exchange_code(self, code: str, code_verifier: str) -> dict[str, Any]:
        """
        POST the authorization code + PKCE verifier to Microsoft's token endpoint.

        The client_secret is sent alongside code_verifier. This is a confidential
        client flow: the secret proves to Microsoft that the request comes from our
        server (not a public client). Both PKCE and the client secret are required;
        neither alone is sufficient.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.MICROSOFT_TOKEN_URL,
                data={
                    "client_id":     settings.AZURE_CLIENT_ID,
                    "client_secret": settings.AZURE_CLIENT_SECRET,
                    "code":          code,
                    "redirect_uri":  settings.OAUTH_REDIRECT_URI,
                    "grant_type":    "authorization_code",
                    "code_verifier": code_verifier,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            return response.json()

    async def _log_attempt(
        self,
        slug: str | None,
        claimed_email: str | None,
        intended_email: str | None,
        outcome: str,
        denial_reason: str | None,
        request_ip: str,
        user_agent: str,
        entra_oid: str | None = None,
    ) -> None:
        """
        Append an immutable access attempt record.

        WHY WE HASH THE IP AND USER AGENT
        ------------------------------------
        Storing raw IP addresses constitutes processing of personal data under GDPR
        and many enterprise privacy policies. We store an HMAC-SHA256 of the IP
        instead. This has two properties:
          - It allows correlating multiple attempts from the same source (abuse detection).
          - It cannot be reversed to recover the original IP without the HMAC secret.
          - It prevents the access_attempts table from becoming a PII database.

        The intended_email is stored plaintext because it IS needed for the audit
        trail — administrators investigating an incident need to know which page
        was targeted. It is the recipient's work email, not the attacker's.
        """
        attempt = AccessAttempt(
            slug=slug,
            claimed_email=claimed_email,
            intended_email=intended_email,
            outcome=outcome,
            denial_reason=denial_reason,
            ip_hash=_hmac_hash(request_ip),
            user_agent_hash=_hmac_hash(user_agent),
            entra_oid=entra_oid,
        )
        self._session.add(attempt)
        await self._session.flush()


def _hmac_hash(value: str) -> str:
    """
    One-way HMAC-SHA256 of a value.

    WHY HMAC AND NOT PLAIN SHA-256
    --------------------------------
    A plain SHA-256 hash can be reversed via rainbow tables or brute force
    (IP addresses have a very limited input space: ~4 billion IPv4 addresses).
    Adding the STATE_HMAC_SECRET as the key makes precomputation infeasible
    because the attacker would need the secret to build the table.
    """
    return hmac.new(
        settings.STATE_HMAC_SECRET.encode(),
        value.encode(),
        hashlib.sha256,
    ).hexdigest()
