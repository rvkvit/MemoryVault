# Security Architecture

---

## 1. Threat Model Summary

| Actor | Threat | Mitigation |
|---|---|---|
| External attacker | Brute-force the slug URL space | Slug alone grants nothing — Entra ID auth required |
| External attacker | Steal session cookie | `HttpOnly; Secure; SameSite=Lax; __Host-` prefix |
| Colleague with wrong link | Access another person's page | Email-from-token must match recipient.email |
| Admin insider | Leak recipient data | Audit log on all mutations; RBAC minimally scoped |
| Guestbook spammer | Post abusive content | Auth required, rate-limited, per-user post cap |
| XSS attacker | Inject script via guestbook | HTML-stripped on write; CSP blocks inline scripts |
| CSRF attacker | Forge state on OAuth callback | HMAC-signed state parameter |
| Clickjacker | Embed page in iframe | `X-Frame-Options: DENY`; CSP `frame-ancestors 'none'` |
| Media hotlinker | Serve blob URLs directly | Blobs are private; API issues time-scoped CDN tokens |

---

## 2. Identity & Access Control

### Recipient Access

```
URL slug            → routing only (not a credential)
Entra ID auth       → verifies real identity
token.email         → checked against recipients.email (server-side)
Session cookie      → opaque, HttpOnly, not inspectable by browser JS
```

No capability is granted by knowing or guessing a slug. The URL is a convenience routing handle, not a security token.

### Admin Access

- Separate Entra ID App Role: `farewell-admin`
- Validated from `roles` claim in access token (not self-asserted)
- Admin routes are in a separate path prefix with a dedicated middleware stack
- All admin actions written to `audit_log` with before/after snapshots

### Service-to-Service

- Container Apps → Azure SQL: Managed Identity + private endpoint (no connection string in env)
- Container Apps → Redis: Managed Identity + private endpoint
- Container Apps → Key Vault: System-assigned Managed Identity, `Key Vault Secrets User` role
- Container Apps → Azure Blob: Managed Identity, `Storage Blob Data Contributor` scoped to single container
- Container Apps → Azure Communication Services: Managed Identity

No credentials stored in environment variables, Dockerfiles, or source code.

---

## 3. HTTP Security Headers

Applied globally at the API and Next.js levels:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'nonce-{per-request-nonce}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://cdn.farewell.contoso.com data:;
  media-src 'self' https://cdn.farewell.contoso.com;
  connect-src 'self' https://api.farewell.contoso.com;
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store, no-cache, private    (on authenticated responses)
```

CSP nonce is generated per request (server-side, crypto random 16 bytes, base64).

---

## 4. Input Validation & Sanitization

### All inputs validated with Zod at the API boundary:

```
slug            → /^[a-z0-9-]{3,120}$/
email           → RFC 5322 pattern + Entra ID normalization
message         → string, min 10, max 2000 chars
reactionEmoji   → single emoji character (Segoe UI Emoji range check)
file name       → allowlist of safe characters, no path traversal
```

### Guestbook messages:

1. Receive raw text from request body
2. Strip all HTML tags (DOMPurify equivalent, server-side)
3. Truncate to 2000 chars
4. Store sanitized version
5. Render as plain text on frontend (React escapes by default)

Personalized messages (admin-authored):

1. Validated as HTML
2. Sanitized with DOMPurify allowlist (no `<script>`, `<iframe>`, event handlers)
3. Stored as sanitized HTML
4. Rendered via `dangerouslySetInnerHTML` only after sanitization

---

## 5. OAuth / PKCE / CSRF Protection

### State parameter (CSRF prevention):

```
state = base64url(JSON.stringify({
  slug:           <url-slug>,
  nonce:          <crypto.randomBytes(32).toString('hex')>,
  pkce_verifier:  <stored in Redis, not in state>,
  ts:             <unix timestamp>
}))

signed_state = state + "." + HMAC-SHA256(state, STATE_SECRET)
```

Validation on callback:
1. Re-derive HMAC from received state payload — must match signature
2. Check `ts` is within 5 minutes
3. Retrieve `pkce_verifier` from Redis using `nonce` as key
4. Delete Redis entry after retrieval (one-time use)
5. Validate PKCE S256 challenge

### Nonce (replay prevention):

- Nonce included in ID token request
- Nonce claim in received `id_token` must match stored nonce
- Redis entry deleted after use

---

## 6. Session Security

```
Cookie name:    __Host-farewell-session
Prefix:         __Host- enforces Secure + Path=/ + no Domain attribute
Flags:          HttpOnly, Secure, SameSite=Lax
Value:          opaque 32-byte hex token (not a JWT)
Storage:        Redis (server-side only)
TTL:            8 hours sliding, 24 hours hard cap
```

Session binding (stored in Redis session object):
- `ip_address`: first-seen IP (advisory warning if changes significantly)
- `user_agent_hash`: SHA-256 of user-agent (advisory)
- `entra_oid`: must match on every request

Session revocation:
- Explicit logout: immediate Redis DELETE
- Admin unpublishes page: invalidates all active sessions for that page's recipient
- Entra ID token expires: sessions are independent of token expiry (8h TTL is the control)

---

## 7. Media Security

Private Azure Blob Storage — all blobs in a non-public container.

Serving media to recipients:
1. Client requests media via API endpoint
2. API validates session and recipient authorization
3. API generates a time-limited SAS token (TTL: 15 minutes) via Managed Identity
4. Client receives CDN URL with embedded SAS query string
5. CDN validates SAS — serves asset without hitting origin API

Serving media to admins (uploads):
1. Admin requests upload URL via `POST /api/v1/admin/media/upload-token`
2. API generates write-scoped SAS (TTL: 10 minutes, single blob path)
3. Admin uploads directly from browser to Blob Storage
4. Admin confirms upload → API registers asset in DB
5. Never: admin uploads through the API server (avoids API as bandwidth bottleneck)

CDN cache headers on media:
```http
Cache-Control: private, max-age=900    (15 min, matches SAS TTL)
```

---

## 8. Rate Limiting & Abuse Prevention

Implemented via `@fastify/rate-limit` backed by Redis:

| Surface | Limit | Window | Block Duration |
|---|---|---|---|
| `/auth/login` per IP | 10 requests | 5 minutes | 15 minutes |
| `/auth/callback` per IP | 10 requests | 5 minutes | 15 minutes |
| Guestbook POST per session | 3 posts | Per page, lifetime | Permanent for page |
| Guestbook POST per session | 1 post | 30 seconds | Soft (queue) |
| All admin routes | 200 requests | 1 minute | 5 minutes |
| General authenticated reads | 60 requests | 1 minute | 5 minutes |

IP hashing for abuse detection:
- Raw IPs are never stored in the database
- `HMAC-SHA256(ip, IP_HASH_SECRET)` stored in `access_attempts` and `guestbook_entries`
- Allows duplicate-IP detection and blocking without storing PII

Azure Front Door WAF rules (applied before traffic reaches ACA):
- OWASP Core Rule Set 3.2 (managed)
- Rate limit: 1000 req / 60s per IP at Front Door level
- Geo-blocking: configurable (default: allow all countries)
- SQL injection and XSS rules in Prevention mode

---

## 9. Data Privacy

| Data Class | Storage | Retention | Access |
|---|---|---|---|
| Recipient PII (name, email, title) | Azure SQL | Until admin deletes | Admin only |
| Guestbook messages | Azure SQL | Until page expires | Recipient + all authenticated colleagues |
| Media assets | Azure Blob + SQL metadata | Until admin deletes | Recipient only (SAS-gated) |
| Raw IP addresses | Never stored | N/A | N/A |
| IP hashes | Azure SQL | 2 years | Security team via DB |
| Session data | Redis | 8 hours (TTL) | Server only (HttpOnly cookie) |
| Access attempt logs | Azure SQL | 2 years | Admin + security |
| Audit logs | Azure Monitor | 2 years | Admin + security |
| Entra ID tokens | Never persisted | N/A | N/A |

GDPR / Privacy considerations:
- This app processes employee data — ensure HR and legal sign-off before deployment
- Guestbook entries constitute authored content — authors can request deletion via admin
- Audit logs may need to be scoped under a Data Retention Policy

---

## 10. Dependency Security

| Control | Tooling |
|---|---|
| Known CVE scanning | Trivy (container), npm audit, OWASP Dependency Check |
| License compliance | license-checker in CI |
| Pinned dependencies | Exact versions in package.json, lockfile committed |
| Supply chain | Package provenance via npm attestations (Node 22+) |
| Container base image | `node:22-alpine` (minimal surface), rebuilt weekly |
| Secrets in code | Gitleaks pre-commit hook + GitHub secret scanning |
| SCA in CI | OWASP Dependency Check (fail on CVSS ≥ 7.0) |

---

## 11. Penetration Testing Scope

Pre-launch checklist:
- [ ] OWASP Top 10 assessment against staging environment
- [ ] Broken Object-Level Authorization (BOLA) test: attempt cross-recipient access
- [ ] Auth bypass: test slug without auth, test with wrong Entra ID account
- [ ] Session fixation and cookie theft scenarios
- [ ] CSRF on all state-mutating endpoints
- [ ] XSS via guestbook and personalized message field
- [ ] Media access: attempt to access blob URLs without SAS
- [ ] Rate limiting effectiveness
- [ ] SQL injection via Prisma parameterized queries (verify no raw query construction)
- [ ] Azure WAF rule coverage
