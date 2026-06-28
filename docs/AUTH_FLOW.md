# Authentication & Authorization Flow

---

## 1. Design Principles

1. **Identity from the provider, not the URL.** The slug in the email link is for routing only. The security boundary is the email claim from a verified Entra ID ID token.
2. **Server-side sessions, not client-side tokens.** The browser never holds a JWT. The session cookie carries an opaque reference to a server-side session in Redis.
3. **Zero-trust recipient validation.** Even after a valid Entra ID login, the backend re-checks that the authenticated email matches the intended recipient for the slug. These are two independent checks.
4. **PKCE for all flows.** We use Authorization Code + PKCE even in the server-side flow to guard against authorization code interception attacks.
5. **Signed state parameter.** The OAuth `state` parameter is HMAC-SHA256 signed to prevent CSRF on the callback endpoint.

---

## 2. Sequence: First Visit (No Session)

```
User (Browser)          Next.js Edge             API (Fastify)         Entra ID / MSAL
      │                  Middleware                    │                      │
      │                      │                         │                      │
(1)   │── GET /to/jane-doe ──►                         │                      │
      │                      │                         │                      │
      │                 [No session cookie]             │                      │
      │                      │                         │                      │
(2)   │◄── 302 /api/v1/auth/login?slug=jane-doe ───────│                      │
      │                      │                         │                      │
(3)   │── GET /api/v1/auth/login?slug=jane-doe ─────────►                     │
      │                      │                         │                      │
      │                      │                    Generate PKCE pair          │
      │                      │                    Generate nonce              │
      │                      │                    Build signed state          │
      │                      │                    Store {verifier, nonce}     │
      │                      │                    in Redis (TTL 5 min)        │
      │                      │                         │                      │
(4)   │◄── 302 https://login.microsoftonline.com/...?  │                      │
      │    response_type=code                          │                      │
      │    client_id=...                               │                      │
      │    scope=openid profile email                  │                      │
      │    redirect_uri=.../auth/callback              │                      │
      │    state=<HMAC-signed JSON>                    │                      │
      │    code_challenge=<S256>                       │                      │
      │    nonce=<random>                              │                      │
      │                      │                         │                      │
      │                      │                         │                      │
(5)   │── User authenticates with Entra ID ────────────────────────────────── ►
      │◄─────────────────────────────────────────── 302 /auth/callback?code=.─│
      │                      │                         │                      │
(6)   │── GET /api/v1/auth/callback?code=...&state=... ►                     │
      │                      │                         │                      │
      │                      │              Validate state HMAC ✓             │
      │                      │              Validate state timestamp ✓        │
      │                      │              Retrieve {verifier, nonce}        │
      │                      │              from Redis ✓                      │
      │                      │                         │                      │
(7)   │                      │                         │── POST /token ───────►
      │                      │                         │   grant_type=authorization_code
      │                      │                         │   code=...
      │                      │                         │   code_verifier=...
      │                      │                         │◄── id_token, access_token ─
      │                      │                         │                      │
      │                      │              Validate id_token:                │
      │                      │              - signature (JWKS) ✓              │
      │                      │              - issuer (tenant) ✓               │
      │                      │              - audience (client_id) ✓          │
      │                      │              - nonce ✓                         │
      │                      │              - expiry ✓                        │
      │                      │                         │                      │
(8)   │                      │              Extract email claim               │
      │                      │              Look up recipient by slug         │
      │                      │                         │                      │
      │                      │              ┌──────────────────────┐          │
      │                      │              │ email === recipient?  │          │
      │                      │              └──────────────────────┘          │
      │                      │                 │               │              │
      │                      │               YES               NO             │
      │                      │                 │               │              │
(9a)  │◄────────────────────────── 302 /to/jane-doe + Set-Cookie ─           │
      │                      │                         │                      │
(9b)  │◄────────────────────────────────── 302 /denied?reason=identity_mismatch
      │                      │                         │                      │
```

---

## 3. Sequence: Returning Visit (Active Session)

```
User (Browser)          Next.js Edge             API (Fastify)         Redis
      │                  Middleware                    │                 │
      │                      │                         │                 │
(1)   │── GET /to/jane-doe ──►                         │                 │
      │                      │                         │                 │
      │              Read __Host-farewell-session       │                 │
      │              cookie                            │                 │
      │                      │── GET /api/v1/me ────── ►                 │
      │                      │                         │── GET session ──►
      │                      │                         │◄── session ─────│
      │                      │                    Validate expiry ✓      │
      │                      │                    Validate IP match*      │
      │                      │                    Slide TTL              │
      │                      │◄── 200 {email, role} ───                  │
      │                      │                         │                 │
      │              [session.email === page.email ✓]  │                 │
      │                      │                         │                 │
      │◄──── SSR page HTML ──│                         │                 │
```

*Strict IP binding is configurable — some enterprise proxies change IPs mid-session.*

---

## 4. Sequence: Wrong Identity (Access Denied)

```
Attacker (Browser)      Next.js Edge             API (Fastify)
      │                  Middleware                    │
      │                      │                         │
(1)   │── GET /to/jane-doe ──►  (has forwarded jane's link)
      │                      │                         │
(2)   │◄── 302 /api/v1/auth/login?slug=jane-doe ───────│
      │                      │                         │
(3)   │  (Attacker logs in as attacker@contoso.com)    │
      │                      │                         │
(4)   │── GET /auth/callback?code=... ─────────────────►
      │                      │                         │
      │                      │   token.email = attacker@contoso.com
      │                      │   recipient.email = jane.doe@contoso.com
      │                      │   MISMATCH → deny
      │                      │                         │
      │                      │   Log access_attempts row:
      │                      │   {outcome: 'denied', claimed: attacker, intended: jane}
      │                      │                         │
(5)   │◄── 302 /denied?reason=identity_mismatch ───────│
      │                      │                         │
      │  (Denied page shown — no page content visible) │
```

The `/denied` page never reveals the recipient's email or any page details.

---

## 5. Session Lifecycle

```
Session Created ──────────────────────────────────────────── Session Expired
     │                                                              │
     │                                                              │
     ├─── Max TTL: 8 hours ─────────────────────────────────────── ►
     │
     ├─── Sliding window: each authenticated request renews TTL by 8h
     │    (capped at 24h from creation to force re-auth daily)
     │
     ├─── Explicit logout: DELETE from Redis immediately
     │
     └─── Admin revocation: DELETE from Redis immediately
          (use case: page unpublished while recipient is viewing)
```

---

## 6. Token Claims Used

From the Entra ID `id_token` (JWT):

| Claim | Used For |
|---|---|
| `email` or `preferred_username` | Recipient identity match (primary) |
| `oid` | Stored in session for Graph API calls (avatar fetch) |
| `name` | Display name in guestbook entries |
| `tid` | Tenant validation (must match configured tenant ID) |
| `nonce` | Replay attack prevention |
| `exp` | Token expiry validation |
| `iss` | Issuer validation |
| `aud` | Audience validation (client_id) |

**Note on email claim:** Entra ID may issue `email`, `preferred_username`, or `upn`. The API normalizes to lowercase and checks all three in priority order. The admin must register the recipient with the canonical UPN as it appears in Entra ID.

---

## 7. Admin Authentication

Admins authenticate via the same Entra ID flow but are routed to `/admin/*`. Authorization is based on Entra ID App Role:

- App role `farewell-admin` → full admin access
- App role `farewell-viewer` → read-only admin access

App roles are defined in the Entra ID app registration manifest and assigned to users/groups in the Azure Portal. The API middleware validates the `roles` claim in the access token (not the ID token).

---

## 8. MSAL Configuration

**Tenant type:** Single-tenant (configured org only).  
**App registration:**

| Setting | Value |
|---|---|
| Application type | Web (server-side) |
| Redirect URIs | `https://farewell.contoso.com/api/v1/auth/callback` |
| Implicit grant | Disabled |
| ID tokens | Enabled (for hybrid flow) |
| Access tokens | Enabled |
| Supported account types | `Single tenant` |
| Client secret | Rotated via Key Vault reference, 90-day expiry |

**Scopes requested:**
- `openid` — for ID token
- `profile` — for name claim
- `email` — for email claim
- `User.Read` — to call Microsoft Graph for avatar photo

---

## 9. Security Events That Trigger Alerts

| Event | Alert |
|---|---|
| > 5 denied access attempts for a single slug in 10 minutes | Azure Monitor alert → admin email |
| > 20 failed OAuth callbacks from a single IP in 5 minutes | Rate limit + alert |
| Admin action outside business hours | Advisory alert |
| Session created from a new country | Log + flag for review |
| Any `access_attempts` row with `outcome=denied` | Written to audit table (always) |
