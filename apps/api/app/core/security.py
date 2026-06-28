"""
Core cryptographic utilities for the Farewell application.

AUTHENTICATION ARCHITECTURE
----------------------------
This application uses invitation-based authentication instead of OAuth.

  1. Invitation Token
     - Generated with secrets.token_urlsafe(64) (512 bits of entropy)
     - Only the SHA-256 hash is stored in the database — the raw token is
       single-use and never persisted, preventing database-dump attacks
     - 30-day expiry
     - First activation: validate hash → set session JWT + device cookie
     - Returning same browser: recognized by device cookie
     - Different device: blocked with non-revealing error message

  2. Application Session JWT (HS256)
     - Issued after successful invitation validation
     - Stored in HttpOnly, Secure, SameSite=Lax cookie
     - Contains: email, role, recipient_id, slug
     - 30-day expiry for invitation sessions (matching token lifetime)
     - 8-hour expiry for admin sessions

SESSION COOKIE
--------------
  __Host-farewell-session (production):
    - Secure: true     — HTTPS only
    - HttpOnly: true   — JavaScript cannot read it (blocks XSS theft)
    - SameSite: Lax    — Blocks CSRF from cross-site POST
    - Path: /          — Sent on all paths under the same origin
    - __Host- prefix   — Prevents subdomain injection attacks

  farewell-session (development, HTTP):
    - Same flags except Secure=false and no __Host- prefix
"""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from app.core.config import settings
from app.core.exceptions import InvalidTokenError, TokenExpiredError
from app.core.log import get_logger

logger = get_logger(__name__)


# ── Invitation token hashing ───────────────────────────────────────────────────

def generate_invitation_token() -> tuple[str, str]:
    """
    Return (raw_token, token_hash).

    raw_token  — 64 random bytes encoded as URL-safe base64 (512-bit entropy).
                 Sent to the recipient in the invitation URL. Never stored.
    token_hash — SHA-256(raw_token). Stored in the database.
                 Even if the database is compromised, the hash cannot be
                 reversed to recover a usable invitation URL.
    """
    raw = secrets.token_urlsafe(64)
    h = hashlib.sha256(raw.encode()).hexdigest()
    return raw, h


def hash_token(raw: str) -> str:
    """Return the SHA-256 hex digest of a raw invitation token."""
    return hashlib.sha256(raw.encode()).hexdigest()


# ── Application JWT ────────────────────────────────────────────────────────────

def create_access_token(
    *,
    subject: str,
    email: str,
    name: str,
    role: str,
    recipient_id: str | None = None,
    slug: str | None = None,
    expire_hours: int | None = None,
) -> str:
    """
    Issue a signed HS256 application JWT.

    Claims:
      sub          Standard JWT subject (= email).
      email        Lowercase, stripped email address.
      name         Display name.
      role         'recipient' | 'admin'.
      recipient_id DB ID of the Recipient record (only for role=recipient).
      slug         URL slug for post-login redirect (only for role=recipient).
      jti          Unique token ID — enables future blocklist support.
      iat / exp    Issued-at and expiry timestamps.
    """
    now = datetime.now(timezone.utc)
    hours = expire_hours if expire_hours is not None else settings.JWT_ACCESS_TOKEN_EXPIRE_HOURS
    expire = now + timedelta(hours=hours)

    payload: dict[str, Any] = {
        "sub":   subject,
        "email": email,
        "name":  name,
        "role":  role,
        "jti":   str(uuid.uuid4()),
        "iat":   int(now.timestamp()),
        "exp":   int(expire.timestamp()),
    }
    if recipient_id:
        payload["recipient_id"] = recipient_id
    if slug:
        payload["slug"] = slug

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and verify an application JWT.

    Verifies signature, expiry, and required claims.
    Raises TokenExpiredError or InvalidTokenError on failure.
    """
    try:
        claims = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except ExpiredSignatureError:
        raise TokenExpiredError()
    except JWTError as exc:
        logger.debug("JWT decode failed", extra={"error": str(exc)})
        raise InvalidTokenError()

    for required in ("sub", "email", "role", "jti"):
        if not claims.get(required):
            raise InvalidTokenError(f"Token missing required claim: {required!r}")

    return claims
