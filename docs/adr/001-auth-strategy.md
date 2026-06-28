# ADR-001: Server-Side OAuth with Server-Side Sessions

**Date:** 2026-06-27  
**Status:** Accepted  
**Deciders:** Principal Engineering

---

## Context

The application must ensure that a farewell page is accessible only to its intended recipient. The core security question is: **what is the unforgeable proof of identity?**

Three options were evaluated:

1. **Signed URL with expiry** — Embed a time-limited, HMAC-signed token in the email link. No auth required; the link itself is the credential.
2. **Client-side OAuth (SPA mode)** — Use MSAL.js in the browser; access token stored in memory or sessionStorage; backend validates the JWT on each request.
3. **Server-side OAuth + server-side sessions** — Server handles the full OAuth code exchange; issues an opaque session cookie; session stored in Redis.

---

## Decision

**Option 3: Server-side OAuth + server-side sessions.**

---

## Rationale

### Against Option 1 (Signed URL)

- The signed URL in the email becomes a capability token. If the email is forwarded, screenshotted, or the link is clicked from a shared device, a third party gains access.
- Email is not a secure channel. Links live in email clients indefinitely.
- There is no way to revoke access once the link is shared without rotating all links.
- Does not satisfy the requirement: "if another person tries to open the link, access must be denied." A forwarded signed URL cannot be denied.

### Against Option 2 (Client-Side MSAL SPA)

- Access tokens are held in browser memory or sessionStorage. XSS vulnerabilities can exfiltrate tokens.
- The SPA flow requires a public client (no client secret), weakening the token exchange.
- Client-side token validation is possible but all validation logic is visible to the user.
- Azure Static Web Apps' built-in auth could handle this, but lacks the per-recipient email-match enforcement we need in the redirect flow.

### For Option 3 (Server-Side OAuth + Redis Sessions)

- The `id_token` is exchanged server-side. The browser never receives a JWT.
- The session cookie uses the `__Host-` prefix, enforcing `Secure`, `Path=/`, and prohibiting a `Domain` attribute — the strongest cookie security posture.
- Sessions can be invalidated instantly server-side (logout, admin revoke, page unpublish).
- The email claim extracted from the ID token is from a Entra ID-verified source — it cannot be forged by the client.
- The two-step check (valid Entra ID login → email matches recipient) is atomic on the server and invisible to the client.
- PKCE ensures the authorization code cannot be used by a man-in-the-middle even if intercepted.

---

## Consequences

**Positive:**
- Strong, unforgeable identity verification
- Instant session revocation capability
- No tokens exposed to browser JavaScript

**Negative:**
- More complex than a signed URL — requires Redis, MSAL server-side library, session middleware
- Every authenticated request hits Redis (mitigated: Redis is sub-millisecond at Azure Cache tier)
- Requires server-side rendering (Next.js SSR) — cannot use a fully static site

**Neutral:**
- Users must have a Microsoft organizational account. This is an internal tool — this is by design.
