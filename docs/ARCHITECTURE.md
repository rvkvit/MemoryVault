# Farewell — Software Architecture

**Version:** 1.0  
**Status:** Draft for Review  
**Author:** Principal Engineering  
**Last Updated:** 2026-06-27

---

## 1. Executive Summary

Farewell is a secure, invite-only web application that delivers a personalized farewell experience to departing colleagues. Each colleague receives a unique, cryptographically signed email link. Access is gated by Microsoft Entra ID OAuth — the backend verifies that the authenticated identity matches the intended recipient before serving any content.

The application is designed for internal enterprise use, hosted entirely on Microsoft Azure, and enforces zero-trust identity principles throughout.

---

## 2. System Context

```
┌──────────────────────────────────────────────────────────────────┐
│                         External Actors                          │
│                                                                  │
│   [Admin / Organizer]    [Recipient Colleague]    [Microsoft     │
│   (Content manager,      (Receives email,         Entra ID]      │
│    sends invites)         clicks link)            (Identity      │
│                                                    Provider)     │
└────────────┬─────────────────────┬──────────────────┬───────────┘
             │                     │                  │
             ▼                     ▼                  │
┌────────────────────────────────────────────────────────────────┐
│                      Farewell Application                       │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Admin Portal   │    │  Recipient UI   │◄────── OAuth ───────┘
│  │  (Next.js SSR)  │    │  (Next.js SSR)  │
│  └────────┬────────┘    └────────┬────────┘
│           │                      │
│           └──────────┬───────────┘
│                      ▼
│             ┌─────────────────┐
│             │   API Layer     │
│             │  (Node.js /     │
│             │   TypeScript)   │
│             └────────┬────────┘
│                      │
│         ┌────────────┼────────────┐
│         ▼            ▼            ▼
│    ┌─────────┐  ┌─────────┐  ┌─────────┐
│    │ Azure   │  │ Azure   │  │  Azure  │
│    │  SQL    │  │  Blob   │  │  Redis  │
│    │         │  │ Storage │  │  Cache  │
│    └─────────┘  └─────────┘  └─────────┘
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript | SSR for auth redirects, React ecosystem, Microsoft-aligned |
| Styling | Tailwind CSS + shadcn/ui | Consistent design tokens, accessible, composable |
| Animations | Framer Motion + Lottie + Three.js | Production-grade animation primitives |
| Backend | Node.js 22 LTS, TypeScript, Fastify | Type-safe, high-throughput, low-latency |
| Auth | Microsoft Entra ID, MSAL Node | First-party identity, enterprise SSO |
| Primary DB | Azure SQL (Hyperscale tier) | Relational integrity, auditable, familiar |
| Cache / Sessions | Azure Cache for Redis | Sub-ms session lookup, token invalidation |
| Object Storage | Azure Blob Storage + Azure CDN | Photos, videos, tiered storage |
| Email Delivery | Azure Communication Services | Microsoft-native, delivery tracking |
| Secrets | Azure Key Vault | Rotation, audit trail, RBAC |
| Hosting | Azure Container Apps | Kubernetes-native, auto-scaling, zero-ops |
| CDN / WAF | Azure Front Door Premium | Global edge, WAF policies, DDoS |
| IaC | Azure Bicep | Microsoft-native, strongly typed |
| CI/CD | GitHub Actions | Microsoft-owned, tight ACA integration |
| Monitoring | Azure Monitor + Application Insights | Distributed tracing, alerting |
| Repo | pnpm Workspaces + Turborepo | Monorepo, incremental builds |

---

## 4. Repository & Folder Structure

```
farewell/
│
├── apps/
│   ├── web/                              # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── callback/
│   │   │   │   │   │   └── route.ts      # OAuth callback handler
│   │   │   │   │   └── logout/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── to/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── page.tsx      # Recipient page (SSR)
│   │   │   │   │       └── loading.tsx   # Skeleton / AI loader
│   │   │   │   ├── admin/
│   │   │   │   │   ├── layout.tsx        # Admin shell (RBAC guard)
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── recipients/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   ├── pages/
│   │   │   │   │   │   └── [recipientId]/
│   │   │   │   │   └── media/
│   │   │   │   ├── denied/
│   │   │   │   │   └── page.tsx          # 403 — wrong identity
│   │   │   │   ├── error.tsx             # Global error boundary
│   │   │   │   ├── not-found.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── farewell/             # Page section components
│   │   │   │   │   ├── HeroSection.tsx
│   │   │   │   │   ├── PersonalMessage.tsx
│   │   │   │   │   ├── Timeline.tsx
│   │   │   │   │   ├── PhotoGallery.tsx
│   │   │   │   │   ├── VideoSection.tsx
│   │   │   │   │   ├── Guestbook/
│   │   │   │   │   │   ├── index.tsx
│   │   │   │   │   │   ├── GuestbookEntry.tsx
│   │   │   │   │   │   └── GuestbookForm.tsx
│   │   │   │   │   └── SignatureWall.tsx
│   │   │   │   ├── animations/
│   │   │   │   │   ├── AILoadingScreen.tsx
│   │   │   │   │   ├── ParticleField.tsx
│   │   │   │   │   ├── TypingEffect.tsx
│   │   │   │   │   ├── FloatingOrbs.tsx
│   │   │   │   │   └── RevealOnScroll.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── RecipientForm.tsx
│   │   │   │   │   ├── PageEditor.tsx
│   │   │   │   │   ├── MediaUploader.tsx
│   │   │   │   │   └── TimelineBuilder.tsx
│   │   │   │   └── ui/                   # shadcn/ui components
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── usePageReveal.ts
│   │   │   │   ├── useGuestbook.ts
│   │   │   │   └── useMediaLightbox.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── msal.ts           # MSAL browser config
│   │   │   │   │   └── session.ts        # Session helpers
│   │   │   │   ├── api/
│   │   │   │   │   └── client.ts         # Typed fetch wrapper
│   │   │   │   └── utils/
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   │
│   │   │   └── middleware.ts             # Next.js edge middleware (auth guard)
│   │   │
│   │   ├── public/
│   │   │   └── lottie/                   # Bundled Lottie animations
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                              # Fastify API (Node.js)
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   └── env.ts                # Zod-validated env schema
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── page.controller.ts
│       │   │   ├── guestbook.controller.ts
│       │   │   ├── media.controller.ts
│       │   │   └── admin/
│       │   │       ├── recipients.controller.ts
│       │   │       └── pages.controller.ts
│       │   ├── middleware/
│       │   │   ├── authenticate.ts       # Entra ID JWT validation
│       │   │   ├── authorizeRecipient.ts # Email-match guard
│       │   │   ├── authorizeAdmin.ts     # Admin role guard
│       │   │   ├── rateLimiter.ts
│       │   │   ├── audit.ts              # Auto-log all mutations
│       │   │   └── correlationId.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── page.service.ts
│       │   │   ├── guestbook.service.ts
│       │   │   ├── media.service.ts      # SAS token generation
│       │   │   ├── email.service.ts
│       │   │   └── session.service.ts
│       │   ├── repositories/
│       │   │   ├── recipient.repository.ts
│       │   │   ├── page.repository.ts
│       │   │   ├── guestbook.repository.ts
│       │   │   └── audit.repository.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── page.routes.ts
│       │   │   ├── guestbook.routes.ts
│       │   │   ├── media.routes.ts
│       │   │   └── admin/
│       │   ├── plugins/
│       │   │   ├── swagger.ts            # OpenAPI spec auto-gen
│       │   │   ├── sensible.ts
│       │   │   └── appInsights.ts
│       │   └── app.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   ├── shared-types/                     # DTOs, enums, shared interfaces
│   │   └── src/
│   │       ├── api.types.ts
│   │       ├── domain.types.ts
│   │       └── index.ts
│   ├── email-templates/                  # React Email components
│   │   └── src/
│   │       ├── FarewellInvite.tsx
│   │       └── GuestbookNotification.tsx
│   └── ui-tokens/                        # Design system tokens
│       └── tokens.json
│
├── infra/
│   ├── bicep/
│   │   ├── main.bicep                    # Orchestration entry
│   │   ├── modules/
│   │   │   ├── container-apps.bicep
│   │   │   ├── sql.bicep
│   │   │   ├── redis.bicep
│   │   │   ├── storage.bicep
│   │   │   ├── front-door.bicep          # WAF + CDN
│   │   │   ├── key-vault.bicep
│   │   │   ├── communication-services.bicep
│   │   │   ├── log-analytics.bicep
│   │   │   └── app-insights.bicep
│   │   └── environments/
│   │       ├── dev.bicepparam
│   │       ├── staging.bicepparam
│   │       └── prod.bicepparam
│   └── scripts/
│       ├── seed-dev.ts
│       └── rotate-keys.ts
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        # PR: lint, typecheck, test
│       ├── deploy-staging.yml            # Main branch → staging
│       └── deploy-prod.yml               # Release tag → prod
│
├── docs/
│   ├── adr/                              # Architecture Decision Records
│   │   └── 001-auth-strategy.md
│   ├── ARCHITECTURE.md                   # This document
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   ├── AUTH_FLOW.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── UI_FLOW.md
│   └── FUTURE.md
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 5. Component Interaction Diagram

```
Browser                  Next.js Edge            API (Fastify)         Entra ID
   │                      Middleware                   │                   │
   │──GET /to/{slug}──►│                               │                   │
   │                   │──check session cookie         │                   │
   │                   │   (no session)                │                   │
   │◄──302 /auth/login─│                               │                   │
   │                   │                               │                   │
   │──GET /auth/login──►                               │                   │
   │◄──302 Entra ID auth URL (with state=slug)─────────────────────────────│
   │                                                   │                   │
   │──authenticates with Entra ID────────────────────────────────────────► │
   │◄──302 /auth/callback?code=...──────────────────────────────────────── │
   │                                                   │                   │
   │──GET /auth/callback───────────────────────────────►                   │
   │                      │                            │──exchange code──► │
   │                      │                            │◄──id_token─────── │
   │                      │                            │                   │
   │                      │                       validate token
   │                      │                       extract email
   │                      │                       lookup recipient by slug
   │                      │                       email match? yes/no
   │                      │                            │
   │                      │                       [match] set session
   │◄─────────────────────│◄──302 /to/{slug}+cookie──  │
   │                      │                            │
   │──GET /to/{slug}──────►                            │
   │                      │──valid session──────────── │
   │◄──page HTML (SSR)────│                            │
```

---

## 6. Key Architectural Decisions

| Decision | Choice | Alternative Considered | Reason |
|---|---|---|---|
| Auth boundary | Entra ID OAuth (server-side) | Client-side MSAL SPA | Server-side token exchange is non-extractable; avoids token leakage in browser |
| Security identifier | Email from verified ID token | Slug in URL | URL slug is routing only — email from Entra ID is the unforgeable identity claim |
| Session storage | Redis (server-side) | JWT cookies | Supports instant revocation; no client-held capability |
| API framework | Fastify | Express / .NET Minimal API | Lower overhead, native schema validation, TypeScript-first |
| ORM | Prisma | TypeORM / raw SQL | Type-safe migrations, schema as single source of truth |
| Media upload | Client → Azure Blob (SAS) | Server-proxied upload | Avoids API as bandwidth bottleneck; SAS tokens are time-scoped |
| Frontend hosting | Container Apps (same env) | Azure Static Web Apps | Keeps SSR auth middleware on server; avoids SAWA's OAuth limitations |
| IaC | Bicep | Terraform | Microsoft-native, no third-party state backend, tighter RBAC integration |

---

## 7. Non-Functional Requirements

| Attribute | Target |
|---|---|
| Availability | 99.9% (SLA backed by Azure Container Apps + Front Door) |
| Page load (P95) | < 2.5s (LCP) from CDN edge |
| Auth flow latency | < 1.5s round-trip after Entra ID redirect |
| Concurrent users | 500 simultaneous (auto-scale ACA) |
| Data residency | Single region (configurable, default East US 2) |
| Session TTL | 8 hours (configurable per deployment) |
| Media upload size | 500 MB per asset (video), 20 MB per photo |
| Audit log retention | 2 years (Azure Monitor) |
| RBAC roles | `farewell-admin`, `farewell-viewer` |
