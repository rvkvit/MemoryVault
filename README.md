# Farewell

A private, personalised farewell experience for departing colleagues.

When someone leaves your organisation, you create a farewell page just for them — a place for a personal message, a photo gallery, a career timeline, and a Memory Vault where colleagues leave written notes, voice recordings, and photos. The page is sent to the recipient via a unique invitation link. Only that person can open it on their device. No accounts, no Microsoft login, no Azure setup required.

---

## What it looks like

| Feature | Description |
|---|---|
| **AI loading screen** | When the recipient opens their invitation link, a cinematic loading sequence plays before the page reveals itself |
| **Personal message** | A rich, heartfelt message written by you directly to the recipient |
| **Career timeline** | Key milestones from the colleague's journey — first project, promotions, memorable moments |
| **Photo & video gallery** | Upload photos and a video message from the team |
| **Leave a Memory** | A section at the end of the farewell page where the recipient (or colleagues you share the form with) can leave written memories, a 60-second voice note, and a photo |
| **Stay Connected** | After leaving a memory, visitors see a personal email and LinkedIn link |
| **Admin portal** | A full back-office dashboard to manage recipients, edit pages, generate invitation links, and track analytics |
| **Visitor analytics** | See when the recipient first opened their page, how long they spent, how many times they returned, and what device they used — with charts |
| **Memory Vault** | Admin view of all memories submitted — read messages, listen to voice notes, view photos, mark favourites, search, filter, and export as CSV |

---

## How it works (plain English)

1. **Admin signs in** at `/admin` with their email address and password
2. **Admin creates a recipient** — enters the colleague's name, email, department, and last day
3. **Admin edits the farewell page** — writes a personal message, adds timeline milestones, uploads photos
4. **Admin generates an invitation link** on the Invitation tab of the recipient's profile
5. **Admin sends the link** to the recipient (copy and paste it into an email or message)
6. **Recipient clicks the link** — their device is recognised, they see a loading animation, and the page opens
7. **Same browser, returning visit** — the page opens automatically without needing the link again
8. **Different device tries the same link** — access is blocked with a message saying the invitation was already activated elsewhere. The admin can reset this from the portal.
9. **Memories** are submitted at the bottom of the farewell page and stored in the admin's Memory Vault

> **Security in plain English:** The invitation link can only be used once, from one device. If someone else gets hold of the link after the recipient has already opened it, they will be told it has been activated and shown nothing else. The link expires after 30 days. Only the hash of the link is stored in the database — the raw link itself is never saved anywhere, so even a database leak cannot produce a working invitation URL.

---

## Prerequisites

You need the following installed on your computer before you start:

| Tool | Why | Download |
|---|---|---|
| **Python 3.11 or newer** | Runs the backend server | [python.org](https://www.python.org/downloads/) |
| **Node.js 18 or newer** | Runs the frontend website | [nodejs.org](https://nodejs.org/) |
| **Git** | To clone this repository | [git-scm.com](https://git-scm.com/) |

No Microsoft Azure account, no cloud services, and no third-party sign-in provider are required.

To check if Python and Node are already installed, open a terminal and run:

```
python --version
node --version
```

---

## Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd Farewell
```

---

## Step 2 — Set up the backend (Python API)

Open a terminal in the `apps/api` folder:

```bash
cd apps/api
```

**Create a virtual environment** (keeps Python packages isolated):

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Create your environment file:**

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` in any text editor and fill in these required values:

```env
# Generate two random secrets — run this command twice and paste each output:
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=paste-a-long-random-string-here
STATE_HMAC_SECRET=paste-a-different-long-random-string-here

# Your email address (the one you will use to sign in to the admin portal)
ADMIN_EMAILS=you@yourcompany.com

# Your admin password — generate the hash with:
# python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"
# Then paste the output below (it starts with $2b$)
ADMIN_PASSWORD_HASH=paste-your-bcrypt-hash-here
```

Everything else in `.env` can be left as-is for local development.

**Create the database tables:**

```bash
alembic upgrade head
```

This creates a local `farewell.db` SQLite file — no database server needed for development.

**Start the backend:**

```bash
uvicorn app.main:app --reload --port 8000
```

You should see: `Uvicorn running on http://127.0.0.1:8000`

The API documentation is available at: `http://localhost:8000/docs`

---

## Step 3 — Set up the frontend (Next.js website)

Open a **new** terminal in the `apps/web` folder:

```bash
cd apps/web
```

**Install dependencies:**

```bash
npm install
```

**Create your environment file:**

```bash
# Windows
copy .env.local.example .env.local

# Mac / Linux
cp .env.local.example .env.local
```

Open `.env.local` and optionally add your LinkedIn profile URL (shown after someone leaves a memory):

```env
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/your-profile
```

**Start the frontend:**

```bash
npm run dev
```

You should see: `ready on http://localhost:3000`

---

## Step 4 — Open the app

With both servers running, open your browser and go to:

```
http://localhost:3000/login
```

You will see the sign-in page. Enter the email address from `ADMIN_EMAILS` and the password you used when generating `ADMIN_PASSWORD_HASH`. You will be taken to the admin dashboard.

---

## Using the admin portal

### Adding a colleague

1. Click **Add Colleague** in the sidebar (or the button on the dashboard)
2. Enter their name and email address
3. Fill in optional fields: department, team, job title, hire date, last day
4. Click **Save**

### Writing their farewell page

1. Click on the colleague's name in the dashboard
2. Click the **Page Content** tab
3. Write a **personal message** in the text area
4. Toggle on/off sections: Timeline, Photos, Video
5. Under **Timeline milestones**, click **Add milestone** to add moments from their journey
6. Under **Photos & videos**, drag and drop files to upload
7. Click **Save Changes**

### Publishing and sending the invitation

1. On the **Page Content** tab, click **Publish** when you are ready
2. Click the **Invitation** tab
3. Click **Generate Invitation** — a unique link is shown
4. Click **Copy** and paste the link into an email or message to the recipient
5. The link is valid for 30 days and can only be activated on one device

> **Important:** The invitation link is only shown once. If you need to send a new one (for example, the recipient lost the email), click **Regenerate Invitation** to create a fresh link. The old link stops working immediately.

### If the recipient gets a new device

1. Open the recipient's profile in the admin portal
2. Click the **Invitation** tab
3. Click **Reset Device**
4. The existing invitation link can now be used again from any device

### Tracking visits

Go to **Analytics** in the sidebar to see:
- A chart of daily visits over the last 30 days
- Browser and device breakdown charts
- A table showing each recipient's first visit, last visit, total visits, and average time spent
- Click **Export CSV** to download all data as a spreadsheet

### Memory Vault

Go to **Memory Vault** in the sidebar to:
- Select a colleague and read all memories left for them
- Play voice notes directly in the browser
- View photos
- Click the heart icon to mark a memory as a favourite
- Search by name or message text
- Filter to show only favourites
- Click **Export CSV** to download everything as a spreadsheet

---

## Folder structure

```
Farewell/
├── apps/
│   ├── api/              ← Python backend (FastAPI)
│   │   ├── app/
│   │   │   ├── api/      ← HTTP routes and schemas
│   │   │   ├── application/services/  ← Business logic
│   │   │   ├── core/     ← Config, security, exceptions
│   │   │   └── infrastructure/  ← Database models and repositories
│   │   ├── alembic/      ← Database migrations
│   │   ├── .env.example  ← Environment variable template
│   │   └── requirements.txt
│   └── web/              ← Next.js frontend
│       ├── src/
│       │   ├── app/      ← Pages (admin/, to/[slug]/)
│       │   ├── components/
│       │   └── hooks/
│       └── .env.local.example
└── docs/                 ← Architecture and design documents
```

---

## Common problems

**"I go to /admin and see a sign-in page, but my password is wrong"**
You need to generate a bcrypt hash of your password and put it in `ADMIN_PASSWORD_HASH`. Run:
```
python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"
```
Copy the output (it starts with `$2b$`) into `.env`, then restart the backend.

**"ADMIN_PASSWORD_HASH is not set — I see an error when trying to log in"**
The `ADMIN_PASSWORD_HASH` field in your `.env` is empty. Follow the step above to generate it.

**"The recipient clicks the invitation link and sees 'This invitation has already been activated on another device'"**
The invitation was already opened on a different browser or device. Go to the recipient's Invitation tab in the admin portal and click **Reset Device**, then send the same link again (or click **Regenerate Invitation** for a new one).

**"The invitation link says it is invalid or has expired"**
Invitation links expire after 30 days. Generate a new one from the Invitation tab.

**"I can sign in as admin but the recipient sees 'Access denied'"**
Make sure the farewell page is **published** (Page Content tab → Publish button) before sending the invitation link.

**"alembic: command not found"**
Make sure your virtual environment is activated (you should see `(venv)` at the start of your terminal prompt). Run `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux) first.

**"Cannot find module" errors in the frontend**
Run `npm install` again inside `apps/web`. If the error persists, delete the `node_modules` folder and run `npm install` again.

**"The page says it does not exist"**
Make sure you have published the page in the admin portal (Page Content tab → Publish button).

**"The voice recorder says microphone access denied"**
The browser needs microphone permission. Click the camera/microphone icon in the address bar and allow access, then reload the page.

---

## Running in production

For a real deployment you will want to:

- Replace the SQLite database with PostgreSQL or another production database
- Store uploaded files (photos, voice notes) in cloud storage (e.g. Azure Blob or S3) instead of the local disk
- Set `APP_ENV=production` in `.env`
- Put the app behind HTTPS (required for secure cookies to work properly)
- Set `APP_BASE_URL` and `FRONTEND_URL` to your real domain
- Set strong, unique values for `JWT_SECRET_KEY` and `STATE_HMAC_SECRET`
- Set `UPLOADS_BASE_URL` to the URL where your uploaded files are served from

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full production setup guide.

---

## Technology at a glance

| Layer | Technology | Plain English |
|---|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS | The website the user sees |
| Animations | Framer Motion | Smooth transitions and the AI loading screen |
| Charts | Recharts | The analytics graphs |
| Backend | FastAPI (Python) | The server that handles data and security |
| Database | SQLite (dev) / PostgreSQL (prod) | Where all the data is stored |
| Authentication | Invitation tokens + trusted device cookies | Secure one-device-per-link system, no third-party login |
| File uploads | Local disk (dev) / cloud storage (prod) | Where photos, videos, and voice notes are stored |

---

## Security

Every invitation link is a 512-bit random secret. Only the SHA-256 hash of that secret is stored in the database — the raw link is generated once, shown to the admin once, and never saved anywhere. If the database were ever compromised, an attacker could not reconstruct a working invitation URL from the hashes.

When a recipient clicks their invitation link for the first time:

1. The backend validates the hash
2. A 30-day session cookie is set in the browser
3. A separate 30-day device cookie is also set, recording a fingerprint of that specific browser

On every subsequent visit from the same browser, both cookies are checked. If the session cookie has expired, the device cookie re-issues a fresh session automatically — so the recipient does not need to click the link again.

If someone else tries the invitation link after it has already been activated, they are told the link has already been used on another device. The system does not reveal whose page it was or any other information.

See [docs/SECURITY.md](docs/SECURITY.md) for the full security design.
