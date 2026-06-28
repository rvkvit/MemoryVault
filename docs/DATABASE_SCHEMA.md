# Database Schema

**Engine:** Azure SQL (Hyperscale tier)  
**ORM:** Prisma  
**Migrations:** Prisma Migrate (version-controlled, CI-enforced)

---

## Entity Relationship Diagram

```
Recipients ──────< Pages ──────< MediaAssets
     │                │
     │                └──────< GuestbookEntries
     │
     └──────< EmailDeliveries
     └──────< AccessAttempts (audit)

Sessions (keyed to recipient_id)
AuditLog (append-only, keyed to any resource)
```

---

## Tables

### `recipients`

Represents a departing colleague for whom a farewell page exists.

```sql
CREATE TABLE recipients (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  slug                NVARCHAR(120)       NOT NULL UNIQUE,  -- URL segment, e.g. "jane-doe-2024"
  email               NVARCHAR(320)       NOT NULL UNIQUE,  -- Must match Entra ID claim exactly
  display_name        NVARCHAR(255)       NOT NULL,
  job_title           NVARCHAR(255),
  department          NVARCHAR(255),
  team                NVARCHAR(255),
  manager_email       NVARCHAR(320),
  avatar_blob_url     NVARCHAR(2048),
  hire_date           DATE,
  last_day            DATE,
  tenure_years        DECIMAL(5, 2)       GENERATED ALWAYS AS (DATEDIFF(DAY, hire_date, last_day) / 365.25),
  is_active           BIT                 NOT NULL DEFAULT 1,
  created_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),
  created_by          NVARCHAR(320)       NOT NULL,  -- Admin email who created this record

  INDEX ix_recipients_email  (email),
  INDEX ix_recipients_slug   (slug)
);
```

**Notes:**
- `slug` is the URL-safe identifier in the email link. It is *not* a security boundary.
- `email` must match the `preferred_username` / `email` claim from Entra ID.
- `is_active = 0` soft-deletes the record without losing audit history.

---

### `pages`

Content configuration for a recipient's farewell page.

```sql
CREATE TABLE pages (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  recipient_id        UNIQUEIDENTIFIER    NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  personalized_message   NVARCHAR(MAX),       -- Rich HTML / Markdown (sanitized on write)
  theme               NVARCHAR(50)        NOT NULL DEFAULT 'midnight-blue',
  show_guestbook      BIT                 NOT NULL DEFAULT 1,
  show_timeline       BIT                 NOT NULL DEFAULT 1,
  show_photos         BIT                 NOT NULL DEFAULT 1,
  show_video          BIT                 NOT NULL DEFAULT 0,
  custom_soundtrack_url  NVARCHAR(2048),
  is_published        BIT                 NOT NULL DEFAULT 0,
  published_at        DATETIME2(7),
  expires_at          DATETIME2(7),            -- Optional: auto-unpublish after last_day + N days
  view_count          BIGINT              NOT NULL DEFAULT 0,
  created_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),

  UNIQUE (recipient_id)                        -- One page per recipient
);
```

---

### `timeline_events`

Ordered list of career milestones displayed on the recipient's page.

```sql
CREATE TABLE timeline_events (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  page_id             UNIQUEIDENTIFIER    NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  event_date          DATE                NOT NULL,
  title               NVARCHAR(255)       NOT NULL,
  description         NVARCHAR(MAX),
  icon                NVARCHAR(100),           -- Icon identifier from design system
  display_order       INT                 NOT NULL,
  created_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),

  INDEX ix_timeline_page_order (page_id, display_order)
);
```

---

### `media_assets`

Photos and videos associated with a farewell page.  
Files are stored in Azure Blob Storage; this table holds metadata only.

```sql
CREATE TABLE media_assets (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  page_id             UNIQUEIDENTIFIER    NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  asset_type          NVARCHAR(10)        NOT NULL CHECK (asset_type IN ('photo', 'video')),
  blob_url            NVARCHAR(2048)      NOT NULL,   -- Private Blob URL (never exposed directly)
  cdn_url             NVARCHAR(2048),                 -- CDN-fronted URL (public)
  thumbnail_cdn_url   NVARCHAR(2048),
  caption             NVARCHAR(500),
  file_name           NVARCHAR(500),
  file_size_bytes     BIGINT,
  mime_type           NVARCHAR(100),
  width_px            INT,
  height_px           INT,
  duration_seconds    INT,                            -- For video assets
  display_order       INT                 NOT NULL DEFAULT 0,
  uploaded_by_email   NVARCHAR(320)       NOT NULL,
  is_approved         BIT                 NOT NULL DEFAULT 1,
  created_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),

  INDEX ix_media_page_order (page_id, display_order)
);
```

---

### `guestbook_entries`

Messages left by other colleagues on the recipient's farewell page.

```sql
CREATE TABLE guestbook_entries (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  page_id             UNIQUEIDENTIFIER    NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  author_email        NVARCHAR(320)       NOT NULL,   -- From validated Entra ID token
  author_display_name NVARCHAR(255)       NOT NULL,
  author_avatar_url   NVARCHAR(2048),                 -- Microsoft Graph photo URL
  message             NVARCHAR(2000)      NOT NULL,   -- Plain text (sanitized)
  reaction_emoji      NVARCHAR(10),                   -- Optional: single emoji reaction
  is_moderated        BIT                 NOT NULL DEFAULT 0,
  is_hidden           BIT                 NOT NULL DEFAULT 0,   -- Admin soft-hide
  ip_hash             NVARCHAR(64),                   -- HMAC hash (not raw IP, for abuse detection)
  created_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at          DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),

  INDEX ix_guestbook_page_time (page_id, created_at DESC)
);
```

**Notes:**
- Only Entra ID-authenticated users can post. Author email is from the validated token, not self-reported.
- `ip_hash` is an HMAC-SHA256 of the real IP using a server-side secret — allows duplicate detection without storing PII.

---

### `email_deliveries`

Tracks the lifecycle of the invitation email sent to each recipient.

```sql
CREATE TABLE email_deliveries (
  id                      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  recipient_id            UNIQUEIDENTIFIER    NOT NULL REFERENCES recipients(id),
  provider_message_id     NVARCHAR(255),              -- ACS delivery ID
  sent_at                 DATETIME2(7),
  delivery_status         NVARCHAR(50),               -- 'pending', 'delivered', 'bounced', 'failed'
  opened_at               DATETIME2(7),               -- Tracked via 1x1 pixel
  link_clicked_at         DATETIME2(7),
  bounce_reason           NVARCHAR(500),
  created_at              DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME(),

  INDEX ix_deliveries_recipient (recipient_id)
);
```

---

### `sessions`

Server-side sessions stored in Redis (schema documented for reference).  
Redis key: `session:{session_id}` → JSON blob.

```
{
  "session_id":     "uuid v4",
  "recipient_id":   "uuid",
  "email":          "verified email from Entra ID token",
  "display_name":   "string",
  "role":           "recipient | admin",
  "entra_oid":      "Entra ID object ID",
  "created_at":     "ISO 8601",
  "expires_at":     "ISO 8601",
  "last_active_at": "ISO 8601",
  "ip_address":     "string",
  "user_agent_hash":"string"
}
```

Redis TTL is set to match `expires_at`. Session is renewed on each request (sliding window).

---

### `access_attempts`

Immutable log of every authentication and authorization decision.

```sql
CREATE TABLE access_attempts (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  slug                NVARCHAR(120),              -- Which page was attempted
  claimed_email       NVARCHAR(320),              -- Email from Entra ID token
  intended_email      NVARCHAR(320),              -- Email of actual recipient
  outcome             NVARCHAR(20)        NOT NULL CHECK (outcome IN ('granted', 'denied', 'expired', 'error')),
  denial_reason       NVARCHAR(255),
  ip_hash             NVARCHAR(64),
  user_agent_hash     NVARCHAR(64),
  entra_oid           NVARCHAR(100),
  attempted_at        DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME()
);
-- Append-only. No UPDATE or DELETE permissions granted on this table.
```

---

### `audit_log`

System-wide audit trail for all admin mutations.

```sql
CREATE TABLE audit_log (
  id                  UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
  event_type          NVARCHAR(100)       NOT NULL,   -- e.g. 'recipient.created', 'page.published'
  actor_email         NVARCHAR(320)       NOT NULL,
  actor_entra_oid     NVARCHAR(100),
  resource_type       NVARCHAR(100),
  resource_id         UNIQUEIDENTIFIER,
  before_snapshot     NVARCHAR(MAX),                  -- JSON (previous state)
  after_snapshot      NVARCHAR(MAX),                  -- JSON (new state)
  ip_hash             NVARCHAR(64),
  correlation_id      NVARCHAR(100),                  -- Ties to distributed trace
  occurred_at         DATETIME2(7)        NOT NULL DEFAULT SYSUTCDATETIME()
);
-- Append-only. Archived to Azure Monitor after 90 days.
```

---

## Indexing Strategy

| Table | Index | Rationale |
|---|---|---|
| recipients | email (unique) | Primary identity lookup per auth flow |
| recipients | slug (unique) | URL routing |
| media_assets | (page_id, display_order) | Gallery render order |
| guestbook_entries | (page_id, created_at DESC) | Paginated guestbook feed |
| access_attempts | attempted_at | Security reporting time-range scans |
| audit_log | (actor_email, occurred_at) | Admin activity reports |

---

## Migration Policy

- All schema changes go through Prisma Migrate.
- Migrations run in CI before deploy; deploy is blocked if migration fails.
- Destructive migrations (DROP COLUMN, etc.) require a two-phase deploy: deprecate → remove.
- Migration files are never edited after merge to `main`.
