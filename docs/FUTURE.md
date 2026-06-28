# Future Enhancements

**Horizon planning for post-v1 iterations.**  
Each item is written with enough fidelity that it can become a standalone engineering spec.

---

## Phase 2 — Enrichment (Next 3–6 months)

### 2.1 AI-Generated Personalized Message Drafts

**Problem:** Writing a heartfelt, unique message for each departing colleague takes admin time and quality varies.

**Proposed solution:**
- Integrate Azure OpenAI Service (GPT-4o)
- Admin provides: colleague name, team, tenure, 3–5 bullet-point highlights
- API calls Azure OpenAI to draft a personalized message
- Admin reviews, edits, then publishes — AI assists, never auto-publishes
- Prompt is engineered with a system persona: warm, professional, Microsoft-internal voice

**Architecture delta:**
- New `POST /api/v1/admin/pages/:id/draft-message` endpoint
- Azure OpenAI resource added to Bicep
- RBAC: Azure AI User role on the API's Managed Identity

**Risk:** Hallucinated details — mitigated by requiring admin review before publish.

---

### 2.2 Collaborative Timeline Building

**Problem:** Admin building the timeline alone misses milestones only team members know.

**Proposed solution:**
- "Contribute a memory" flow for other authenticated colleagues
- Colleagues submit a proposed timeline event (date + title + description)
- Admin approves/rejects in the Page Editor
- Approved events flow into the timeline

**Architecture delta:**
- New `timeline_event_submissions` table
- Submission endpoint accessible to all authenticated users
- Admin moderation queue in admin portal

---

### 2.3 Reaction Animations on Guestbook Entries

Allow readers to react to existing guestbook entries (not just post their own).

- Up to 5 unique emoji reactions per entry
- Reactions are anonymous (just a count)
- Floating emoji burst animation on react (Framer Motion)
- Real-time count update via Server-Sent Events (SSE) — no WebSocket overhead

---

### 2.4 Email Delivery Analytics Dashboard

**Current state:** `email_deliveries` table tracks sent/opened/clicked.

**Enhancement:**
- Admin dashboard section showing per-email delivery metrics
- Time-to-open distribution
- Click-through rate
- Bounce reasons
- Powered by Azure Communication Services webhooks → Event Grid → API consumer

---

### 2.5 Multi-Language Support (i18n)

- `next-intl` for frontend localization
- Message catalogs for: EN-US, EN-GB, FR, DE, JA, ZH-CN
- Admin selects page language per recipient
- Email templates localized to match
- RTL layout support (AR) via Tailwind `dir` utilities

---

## Phase 3 — Scale & Platform (6–12 months)

### 3.1 Multi-Tenant Support

Enable multiple organizations (tenants) to use the same deployment.

**Architecture changes:**
- `tenant_id` column added to all user-facing tables
- Row-Level Security (RLS) policies in Azure SQL per tenant
- Entra ID: switch from single-tenant to multi-tenant app registration (or separate app registration per tenant)
- Subdomain routing: `acme.farewell.microsoft.com` vs `contoso.farewell.microsoft.com`
- Azure Front Door: wildcard certificate + origin routing rules per subdomain

**Complexity:** This is a significant architectural shift. Recommend a dedicated ADR before committing.

---

### 3.2 HRIS Integration (Workday / SAP SuccessFactors)

**Problem:** Admins manually enter hire date, tenure, title, department.

**Proposed solution:**
- Webhook listener for HRIS offboarding events
- When HRIS triggers "employee offboarding" event: auto-create a recipient draft with all fields pre-populated
- Admin reviews and publishes — no manual data entry
- Field mapping configuration stored in Key Vault (per tenant in multi-tenant mode)

**Integration surface:**
- `POST /api/v1/webhooks/hris` — inbound webhook (HMAC-verified)
- Support: Workday RAAS API, SAP SuccessFactors OData API

---

### 3.3 Microsoft Teams Integration

**Scenario A — Notification:** When a farewell page is published, post a notification to a configured Teams channel.

**Scenario B — Guestbook via Teams:** Colleagues receive a Teams Adaptive Card asking them to leave a message. Submitting the card posts a guestbook entry via the API (Teams bot → API, using OBO flow for identity).

**Implementation:**
- Microsoft Teams bot (Azure Bot Service)
- Adaptive Card templates for guestbook submission
- Teams webhook for channel notifications
- On-Behalf-Of (OBO) flow for delegated identity from Teams → API

---

### 3.4 Digital Signature Wall

An interactive canvas where colleagues can draw or type a short handwritten-style signature.

- Canvas element (Fabric.js or react-signature-canvas)
- Signatures stored as SVG paths in the `guestbook_entries` table (new `signature_svg` column)
- Displayed as a mosaic wall with each colleague's signature tile
- Tiles animate in as the recipient scrolls

---

### 3.5 Time Capsule Messages

Allow colleagues to leave a message that is only revealed to the recipient at a specified future date.

- `guestbook_entries.reveal_at` column (nullable)
- Messages with `reveal_at` in the future are encrypted at rest (Azure Key Vault envelope encryption)
- Cron job (Azure Container Apps Job) decrypts and marks as visible at reveal time
- Recipient sees a "locked" card for future messages with countdown timer
- Email notification sent when a time capsule message unlocks

---

### 3.6 Video Message Collage

**Problem:** A single team video requires coordination. Individuals never submit.

**Proposed solution:**
- Colleagues record 20–60 second video clips via browser (MediaRecorder API)
- Clips uploaded directly to Azure Blob via SAS
- Admin selects clips to include and ordering
- Azure Media Services stitches clips into a single video (serverless job)
- Final video served via Azure CDN

**Complexity note:** Azure Media Services is being deprecated (2024). Evaluate: FFmpeg in a Container Apps Job, or Azure Video Indexer as alternative.

---

## Phase 4 — Enterprise Hardening (12–18 months)

### 4.1 Azure Private Link for All Egress

Move the Container Apps environment to a fully private, egress-only model:
- Outbound via Azure NAT Gateway + Private Link
- No public IPs on any compute resource
- Only Azure Front Door is the public-facing surface

### 4.2 FIPS 140-2 Compliant Cryptography

For customers in regulated industries (US Government, healthcare):
- Enable FIPS mode in Node.js runtime (`--experimental-fips`)
- Use only FIPS-approved algorithms in all custom crypto (already using HMAC-SHA256, AES-256)
- Azure SQL + Redis support FIPS at infrastructure level

### 4.3 Verifiable Audit Trail

Implement a tamper-evident audit log using Azure Confidential Ledger:
- All `audit_log` writes also written to Azure Confidential Ledger
- Provides cryptographic proof of audit integrity
- Required for some compliance frameworks (SOC2 Type II, ISO 27001)

### 4.4 Conditional Access Policy Integration

Enforce Entra ID Conditional Access Policies (CAP) as a condition for accessing farewell pages:
- Require compliant device
- Require MFA (most tenants already enforce this)
- Block access from non-corporate networks (configurable)
- This is already possible if the tenant's CAP applies to the app registration — document the configuration requirements

### 4.5 Guest Access for External Colleagues

Allow people from outside the org (former colleagues, vendors) to leave a guestbook message:
- Entra ID External Identities (B2B guest flow)
- Guest receives an email invite → authenticates via their own identity provider
- Guestbook entry tagged as "External colleague"
- Admin must enable external access per page (off by default)

---

## Technical Debt to Address Post-Launch

| Item | Priority | Notes |
|---|---|---|
| Replace custom slug generation with CUID2 | Low | Slugs currently built from name + year — edge cases exist |
| Add database read replica for admin reporting | Medium | Read-heavy admin queries should not hit primary |
| Implement CDN purge on page unpublish | High | Cached pages may serve stale content after unpublish |
| Structured logging schema alignment | Medium | Align API log fields with Azure Monitor schema |
| End-to-end Playwright tests for full auth flow | High | Currently covered by mocked unit tests only |
| Load test with k6 (target: 500 concurrent users) | High | Pre-launch SLA validation |
