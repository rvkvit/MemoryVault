# Deployment Architecture

---

## 1. Azure Infrastructure Overview

```
Internet
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│               Azure Front Door Premium (Global Edge)             │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  WAF Policy (OWASP 3.2 Managed Rules + Custom Rules)    │     │
│  │  DDoS Protection Standard                               │     │
│  │  TLS 1.3 termination                                    │     │
│  │  Caching: /cdn/* routes cached at edge                  │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │                            │
         ▼                            ▼
┌──────────────────┐      ┌────────────────────────┐
│  Azure Container │      │  Azure Blob Storage     │
│  Apps (ACA)      │      │  (CDN Origin)           │
│                  │      │                         │
│  ┌────────────┐  │      │  /avatars/*             │
│  │ web app    │  │      │  /media/photos/*        │
│  │ (Next.js)  │  │      │  /media/videos/*        │
│  │            │  │      │  /static/*              │
│  │ min: 1     │  │      └────────────────────────┘
│  │ max: 10    │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ api        │  │
│  │ (Fastify)  │  │  ──────────────────────────────────────►
│  │            │  │              Azure SQL Hyperscale
│  │ min: 1     │  │              (Private Endpoint)
│  │ max: 20    │  │
│  └────────────┘  │  ──────────────────────────────────────►
│                  │              Azure Cache for Redis
└──────────────────┘              (Private Endpoint)
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supporting Services (all on Private Endpoints / VNet)           │
│                                                                  │
│  Azure Key Vault       ─── secrets, connection strings           │
│  Azure Communication   ─── email delivery                        │
│  Services                                                        │
│  Azure Container       ─── Docker image registry                 │
│  Registry (ACR)                                                  │
│  Azure Monitor +       ─── logs, metrics, traces, alerts         │
│  Application Insights                                            │
│  Azure Log Analytics   ─── long-term log retention              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Topology

| Environment | Purpose | Scale | Data |
|---|---|---|---|
| `dev` | Local / PR preview | 1 replica | Synthetic seed data |
| `staging` | Pre-prod validation | 1 replica | Anonymized prod copy |
| `prod` | Live traffic | 1–20 replicas (auto-scale) | Real data |

Each environment is a separate Azure Resource Group with independent credentials, Key Vault references, and database instances.

---

## 3. Container Apps Configuration

### Web App (Next.js)

```yaml
# Conceptual — defined in Bicep
name: farewell-web
image: farewell.azurecr.io/web:{TAG}
resources:
  cpu: 0.5
  memory: 1Gi
scale:
  minReplicas: 1
  maxReplicas: 10
  rules:
    - type: http
      metadata:
        concurrentRequests: "100"
env:
  - name: NEXT_PUBLIC_API_URL
    value: https://farewell.contoso.com/api/v1
  - name: AZURE_TENANT_ID
    secretRef: tenant-id
  - name: AZURE_CLIENT_ID
    secretRef: client-id
```

### API (Fastify)

```yaml
name: farewell-api
image: farewell.azurecr.io/api:{TAG}
resources:
  cpu: 1.0
  memory: 2Gi
scale:
  minReplicas: 1
  maxReplicas: 20
  rules:
    - type: http
      metadata:
        concurrentRequests: "200"
probes:
  liveness:  GET /health/live    (interval: 10s, threshold: 3)
  readiness: GET /health/ready   (interval: 5s,  threshold: 2)
  startup:   GET /health/startup (failureThreshold: 30)
```

---

## 4. CI/CD Pipeline

### Branch Strategy

```
feature/*  ──► PR ──► main ──────────────────► release/v* ──► prod
                        │
                        └──► staging (auto-deploy on merge)
```

### GitHub Actions Workflows

#### `ci.yml` (PR gate — must pass before merge)

```
1. pnpm install (cached)
2. Lint (ESLint, Prettier)
3. TypeScript typecheck (tsc --noEmit)
4. Unit tests (Vitest)
5. Integration tests (Testcontainers — real SQL + Redis)
6. Build (turbo build)
7. Prisma schema validation
8. Docker build (multi-arch: linux/amd64, linux/arm64)
9. Trivy container scan (CRITICAL+HIGH → fail)
10. OWASP Dependency Check
```

#### `deploy-staging.yml` (on push to `main`)

```
1. All CI steps above
2. Push images to ACR (tagged: main-{sha})
3. Run Prisma migrations against staging DB
4. Deploy to staging ACA (blue/green)
5. Smoke test suite (Playwright — 10 critical paths)
6. Update deployment tag in Azure Container Apps
```

#### `deploy-prod.yml` (on tag `release/v*`)

```
1. Require manual approval (GitHub Environment protection rules)
2. Pull staging image (no rebuild — same artifact)
3. Re-tag as release-{version}
4. Run Prisma migrations against prod DB (dry-run first)
5. Deploy to prod ACA (blue/green, 10% canary → 100%)
6. Run smoke test suite against prod
7. Create GitHub release with changelog
8. Notify #farewell-ops Slack channel
```

---

## 5. Blue/Green Deployment

Azure Container Apps supports traffic splitting natively:

```
Phase 1: Deploy new revision (receives 0% traffic)
Phase 2: Smoke tests pass → shift 10% → monitor for 5 minutes
Phase 3: No errors → shift to 100%
Phase 4: Old revision scaled to 0, removed after 30 minutes
Rollback: Any time before Phase 4 — shift traffic back in < 30 seconds
```

---

## 6. Bicep Module Breakdown

```
infra/bicep/main.bicep
│
├── modules/log-analytics.bicep       (deployed first — others depend on it)
├── modules/app-insights.bicep
├── modules/key-vault.bicep
├── modules/acr.bicep
├── modules/vnet.bicep                (VNet + subnets + private DNS zones)
├── modules/sql.bicep                 (Azure SQL Hyperscale + private endpoint)
├── modules/redis.bicep               (Azure Cache for Redis + private endpoint)
├── modules/storage.bicep             (Blob Storage + CDN profile + private endpoint)
├── modules/communication-services.bicep
├── modules/container-apps-env.bicep  (shared ACA environment)
├── modules/container-apps-web.bicep  (web app)
├── modules/container-apps-api.bicep  (API)
└── modules/front-door.bicep          (AFD + WAF policy + custom domain)
```

All modules use `@description` decorators on every parameter.  
Environments are differentiated via `.bicepparam` files — no hardcoded values in module files.

---

## 7. Networking

```
VNet: 10.0.0.0/16
│
├── /24 subnet: Container Apps Environment
├── /27 subnet: Private Endpoints (SQL, Redis, Storage, Key Vault)
└── /28 subnet: Integration subnet (outbound)

Private DNS Zones (linked to VNet):
  privatelink.database.windows.net
  privatelink.redis.cache.windows.net
  privatelink.blob.core.windows.net
  privatelink.vaultcore.azure.net
```

All Azure service traffic stays on the Microsoft backbone — never traverses the public internet from the Container Apps environment.

---

## 8. Secrets Management

All secrets stored in Azure Key Vault. Container Apps reference secrets via:

```json
{
  "name": "db-connection-string",
  "keyVaultUrl": "https://farewell-kv.vault.azure.net/secrets/SqlConnectionString"
}
```

Container Apps use a **system-assigned managed identity** with `Key Vault Secrets User` role. No secrets in environment variables, Dockerfile, or source code.

**Rotation policy:**
- Entra ID client secret: 90-day rotation (automated via Key Vault rotation policy)
- SQL connection string: 180-day rotation
- Redis access key: 90-day rotation
- All rotations trigger a Container Apps revision deployment automatically via Event Grid

---

## 9. Disaster Recovery

| Scenario | RTO | RPO | Mechanism |
|---|---|---|---|
| ACA revision crash | < 30s | 0 | ACA auto-restart + health probes |
| Full ACA environment failure | < 5 min | 0 | Redeploy from ACR (same region) |
| SQL primary failure | < 60s | 0 | Azure SQL Hyperscale auto-failover |
| Redis failure | < 30s | 0 | Redis zone-redundant + ACA handles cache miss gracefully |
| Region outage | < 30 min | < 5 min | Manual failover to paired region (documented runbook) |

---

## 10. Cost Estimates (Production)

| Resource | SKU | Est. Monthly |
|---|---|---|
| Azure Front Door Premium | Standard Origin | ~$35 + traffic |
| Azure Container Apps | Consumption plan | ~$20–80 (traffic-dependent) |
| Azure SQL Hyperscale | 2 vCores | ~$370 |
| Azure Cache for Redis | C1 Standard | ~$55 |
| Azure Blob Storage | LRS + CDN | ~$10–30 |
| Azure Communication Services | Email | ~$0.0025/email |
| Azure Key Vault | Standard | ~$5 |
| Azure Monitor + App Insights | Pay-per-use | ~$20–50 |
| **Total** | | **~$515–645/month** |
