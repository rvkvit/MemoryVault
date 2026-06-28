# MemoryVault

A private, personalised farewell experience for departing colleagues.

When someone leaves your organisation, you create a farewell page just for them — a place for a personal message, a photo gallery, a career timeline, and a Memory Vault where colleagues leave written notes, voice recordings, and photos. The page is sent to the recipient via a unique invitation link. Only that person can open it on their device.

---

## What it looks like

| Feature | Description |
|---|---|
| **AI loading screen** | When the recipient opens their invitation link, a cinematic loading sequence plays before the page reveals itself |
| **Personal message** | A rich, heartfelt message written by you directly to the recipient |
| **Career timeline** | Key milestones from the colleague's journey — first project, promotions, memorable moments |
| **Photo & video gallery** | Upload photos and a video message from the team |
| **Leave a Memory** | A section where colleagues can leave written memories, a 60-second voice note, and a photo |
| **Stay Connected** | After leaving a memory, visitors see a personal email and LinkedIn link |
| **Admin portal** | A full back-office dashboard to manage recipients, edit pages, generate invitation links, and track analytics |
| **Visitor analytics** | See when the recipient first opened their page, how long they spent, how many times they returned, and what device they used |
| **Memory Vault** | Admin view of all memories submitted — read messages, listen to voice notes, view photos, mark favourites, search, filter, and export as CSV |

---

## Technology

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL via Neon (serverless) |
| File storage | Cloudinary (images, videos, voice recordings) |
| Authentication | Invitation tokens + trusted device cookies |
| Hosting | Render (free tier) |

---

## Prerequisites

| Tool | Why |
|---|---|
| **Python 3.12** | Runs the backend server |
| **Node.js 20** | Runs the frontend website |
| **Git** | To clone this repository |
| **A Neon account** | Free PostgreSQL database — [neon.tech](https://neon.tech) |
| **A Cloudinary account** | Free image/video/audio storage — [cloudinary.com](https://cloudinary.com) |

---

## Local development setup

### 1 — Clone the repository

```bash
git clone https://github.com/rvkvit/MemoryVault.git
cd MemoryVault
```

### 2 — Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) — free, no credit card required
2. Create a new project (e.g. `memoryvault`)
3. On the project dashboard, click **Connection Details**
4. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   You will paste this into `.env` as `DATABASE_URL`.

### 3 — Create a Cloudinary account

1. Sign up at [cloudinary.com](https://cloudinary.com) — free tier gives 25 GB storage and 25 GB bandwidth/month
2. From the Cloudinary dashboard, note your:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API key** → `CLOUDINARY_API_KEY`
   - **API secret** → `CLOUDINARY_API_SECRET`

### 4 — Set up the backend

Open a terminal in `apps/api`:

```bash
cd apps/api
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and fill in these required values:

```env
# Two random secrets — run this command twice, paste each output:
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=paste-64-char-hex-here
STATE_HMAC_SECRET=paste-different-64-char-hex-here

# Your admin email and password hash
ADMIN_EMAILS=you@example.com
# python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"
ADMIN_PASSWORD_HASH=paste-bcrypt-hash-here

# Neon connection string (paste as-is from Neon dashboard)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_SSL=true

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 5 — Set up the frontend

Open a **new** terminal in `apps/web`:

```bash
cd apps/web
npm install
```

Create your environment file:

```bash
# Windows
copy .env.local.example .env.local

# Mac / Linux
cp .env.local.example .env.local
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000/login` — sign in with the email from `ADMIN_EMAILS` and the password you used when generating `ADMIN_PASSWORD_HASH`.

---

## Deploy to Render (free tier)

This repo includes `render.yaml` so both services are created automatically.

### Step 1 — Connect the repo

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect your GitHub account and select the **MemoryVault** repository
3. Render reads `render.yaml` and shows two services: `memoryvault-api` and `memoryvault-web`

### Step 2 — Set secrets in the dashboard

Before clicking Apply, set these environment variables on the **memoryvault-api** service:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection Details (the full `postgresql://...` string) |
| `DATABASE_SSL` | Set to `true` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → API Keys |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API Keys |
| `ADMIN_EMAILS` | Your email address, e.g. `you@example.com` |
| `ADMIN_PASSWORD_HASH` | Run: `python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"` |

`JWT_SECRET_KEY` and `STATE_HMAC_SECRET` are auto-generated by Render — no action needed.

### Step 3 — Deploy

Click **Apply**. Render will:
1. Build and deploy the FastAPI backend
2. Run `alembic upgrade head` automatically on first start — creates all tables in Neon
3. Build and deploy the Next.js frontend

### Step 4 — Update service URLs

After the services are created, check the actual URLs assigned by Render (they may have a suffix, e.g. `memoryvault-api-xyz.onrender.com`). If the URLs differ from the defaults in `render.yaml`, update these environment variables on the **memoryvault-api** service:

| Variable | Value |
|---|---|
| `APP_BASE_URL` | `https://your-actual-api-url.onrender.com` |
| `FRONTEND_URL` | `https://your-actual-web-url.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://your-actual-web-url.onrender.com` |

And on the **memoryvault-web** service:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://your-actual-api-url.onrender.com` |

---

## Environment variable reference

### Backend (`apps/api/.env`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | Yes | 64-character random hex. Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `STATE_HMAC_SECRET` | Yes | Same as above, different value |
| `ADMIN_EMAILS` | Yes | Comma-separated list of admin email addresses |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of your admin password |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon or local) |
| `DATABASE_SSL` | No | Set `true` for Neon or any remote PostgreSQL. Default: `false` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Your Cloudinary API secret |
| `APP_ENV` | No | `development` / `staging` / `production`. Default: `development` |
| `APP_BASE_URL` | No | Public URL of the backend. Default: `http://localhost:8000` |
| `FRONTEND_URL` | No | Public URL of the frontend. Default: `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins |
| `JWT_ACCESS_TOKEN_EXPIRE_HOURS` | No | Admin session duration. Default: `8` |
| `INVITATION_TOKEN_EXPIRE_DAYS` | No | Invitation link validity. Default: `30` |
| `MAX_UPLOAD_SIZE_MB` | No | Max file size before upload to Cloudinary. Default: `50` |
| `LOG_LEVEL` | No | `DEBUG` / `INFO` / `WARNING` / `ERROR`. Default: `INFO` |

### Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | No | Backend URL used by Next.js server-side rewrites. Default: `http://localhost:8000` |

---

## Folder structure

```
MemoryVault/
├── apps/
│   ├── api/              ← Python backend (FastAPI)
│   │   ├── app/
│   │   │   ├── api/      ← HTTP routes and schemas
│   │   │   ├── application/services/  ← Business logic
│   │   │   ├── core/     ← Config, security, Cloudinary client
│   │   │   └── infrastructure/  ← Database models and repositories
│   │   ├── alembic/      ← PostgreSQL migrations
│   │   ├── .env.example  ← Environment variable template
│   │   └── requirements.txt
│   └── web/              ← Next.js frontend
│       ├── src/
│       │   ├── app/      ← Pages (admin/, to/[slug]/)
│       │   ├── components/
│       │   └── hooks/
│       └── .env.local.example
├── render.yaml           ← Render Blueprint (one-click deploy)
└── docs/                 ← Architecture and design documents
```

---

## Common problems

**"Database connection failed" on startup**
- Check that `DATABASE_URL` is a valid PostgreSQL connection string
- If using Neon, ensure `DATABASE_SSL=true`
- Test the connection string in the Neon dashboard's SQL editor

**"Invalid cloud_name" or Cloudinary errors**
- Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are all set
- Find them at [cloudinary.com/console](https://cloudinary.com/console) → API Keys

**"I go to /login and my password is wrong"**
- Generate a new bcrypt hash: `python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"`
- Paste the output (starts with `$2b$`) into `ADMIN_PASSWORD_HASH` and restart

**"alembic: command not found"**
- Activate the virtual environment first: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)

**"The recipient sees 'This invitation has already been activated on another device'"**
- Go to the recipient's Invitation tab in the admin portal → **Reset Device**

**"The invitation link says it is invalid or has expired"**
- Invitation links expire after 30 days. Generate a new one from the Invitation tab.

**On Render: services spin down after inactivity (free tier)**
- The free tier sleeps after ~15 minutes of no traffic. The first request after sleep takes ~30 seconds. Upgrade to Starter ($7/month) to prevent this.

---

## Security

Every invitation link is a 512-bit random secret. Only the SHA-256 hash is stored in the database — the raw link is shown to the admin once and never saved anywhere.

When a recipient opens their link for the first time:
1. The backend validates the hash
2. A 30-day session cookie is set in the browser
3. A device fingerprint cookie is also set

On every subsequent visit from the same browser, both cookies are verified. If someone else tries the link after activation, they are told it has already been used on another device.

See [docs/SECURITY.md](docs/SECURITY.md) for the full security design.
