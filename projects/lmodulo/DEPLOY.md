# Deployment Guide

Step-by-step instructions for getting lmodulo live on Railway with `lmodulo.net` as the domain.

** One thing to note from writing it: the wildcard *.lmodulo.net DNS record in Cloudflare must be set to DNS only (grey cloud, not proxied) — Cloudflare can't proxy wildcard CNAMEs. The www and api records can be proxied normally. **

**Services you will set up:**
- **MongoDB Atlas** — managed database
- **Cloudflare** — DNS, SSL, and file storage (R2)
- **Resend** — transactional email
- **Railway** — app hosting (API + Frontend)
- **RunPod** *(optional)* — GPU server for Ollama AI chat, explore MongoDB Atlas services?

**Total time:** ~60–90 minutes first time through.

---

## 1 — MongoDB Atlas

**Why:** Managed MongoDB with automatic backups and replication. Start on the free M0 tier; upgrade to M10 ($57/mo) before going to real clients.

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Create a free account.
2. Create an **Organization** → create a **Project** (name it `lmodulo`).
3. **Build a Database** → choose **M0 Free** → provider `AWS`, region closest to you (e.g. `us-east-1`) → name the cluster `lmodulo`.
4. **Security → Database Access** → Add New Database User:
   - Auth: Password
   - Username: `lmodulo`
   - Autogenerate a strong password — copy it now
   - Role: **Atlas admin** (can tighten later)
5. **Security → Network Access** → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`). Required because Railway's outbound IPs are not static.
6. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://lmodulo:<password>@lmodulo.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with the password from step 4, and append the database name:
   ```
   mongodb+srv://lmodulo:YOURPASSWORD@lmodulo.xxxxx.mongodb.net/appdb?retryWrites=true&w=majority
   ```
   Save this — it becomes `MONGO_URI`.

---

## 2 — Cloudflare Account + Domain

**Why:** Cloudflare gives you DNS management, automatic SSL, DDoS protection, and access to R2 storage — all on the free plan. The only way to use Railway with a custom domain reliably at the apex (`lmodulo.net`) is via Cloudflare's CNAME flattening.

### 2a — Create Cloudflare account and add your domain

1. Sign up at [cloudflare.com](https://www.cloudflare.com) (free plan is sufficient).
2. **Add a Site** → enter `lmodulo.net` → select **Free plan** → Continue.
3. Cloudflare scans your existing DNS records. Leave the results as-is for now — you will replace them later.
4. Cloudflare shows you **two nameservers**, e.g.:
   ```
   ada.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
   Copy both.

### 2b — Update Namecheap nameservers

1. Log in to Namecheap → **Domain List** → click **Manage** next to `lmodulo.net`.
2. **Nameservers** section → change dropdown to **Custom DNS**.
3. Enter the two Cloudflare nameservers from above.
4. Save.
5. Back in Cloudflare → click **Done, check nameservers**.

Propagation takes 5–30 minutes. Cloudflare will email you when your domain is active. You can continue with the next steps while you wait.

---

## 3 — Cloudflare R2 (File Storage)

**Why:** R2 is S3-compatible, has no egress fees, and is built into Cloudflare. The app already uses `STORAGE_PROVIDER=s3` for production.

1. In Cloudflare → left sidebar → **R2** → **Create bucket**.
2. Name: `lmodulo-uploads` → leave location as Auto → **Create bucket**.
3. Open the bucket → **Settings** tab → **Public access** → **Allow Access** → Enable.
4. Copy the **Public bucket URL** (looks like `https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`). Save as `S3_PUBLIC_URL`.
5. Go back to the R2 overview page → **Manage R2 API Tokens** → **Create API Token**:
   - Token name: `lmodulo-production`
   - Permissions: **Object Read & Write**
   - Specify bucket: `lmodulo-uploads`
   - Create token
6. Copy and save:
   - **Access Key ID** → `AWS_ACCESS_KEY_ID`
   - **Secret Access Key** → `AWS_SECRET_ACCESS_KEY`
   - **Account ID** (shown on the R2 overview page) → used to build `S3_ENDPOINT`:
     ```
     https://ACCOUNT_ID.r2.cloudflarestorage.com
     ```

---

## 4 — Resend (Email / SMTP)

**Why:** The app sends password resets and notifications via SMTP. Resend is the simplest provider — 3,000 free emails/month and clean deliverability.

1. Sign up at [resend.com](https://resend.com).
2. **Domains** → **Add Domain** → enter `lmodulo.net`.
3. Resend shows you DNS records to add (SPF, DKIM, DMARC). Add each one in Cloudflare:
   - Cloudflare → **DNS** → **Add record** → enter each record shown by Resend.
   - Set all to **DNS only** (grey cloud, not proxied).
4. Back in Resend → **Verify** the domain. Green means ready.
5. **API Keys** → **Create API Key** → name it `lmodulo-production` → copy the key (starts with `re_`).
6. SMTP credentials to save:
   - `SMTP_HOST=smtp.resend.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=resend`
   - `SMTP_PASS=re_YOURAPIKEY`
   - `SMTP_FROM=lmodulo <noreply@lmodulo.net>`

---

## 5 — Railway: Create Project and Services

**Why:** Railway deploys your Docker containers and handles the infrastructure. You need the **Pro plan** ($20/mo) to use wildcard custom domains (`*.lmodulo.net`).

### 5a — Create the Railway project

1. Sign up at [railway.app](https://railway.app) using your GitHub account.
2. **New Project** → **Deploy from GitHub repo** → select the `Architectonic` repo → **Add variables later** → skip for now.
3. Delete the auto-created service if Railway creates one — you'll add two manually.

### 5b — Create the API service

1. In the project → **New** → **GitHub Repo** → `Architectonic`.
2. Rename the service to `lmodulo-api`.
3. Service → **Settings** → **Source** → **Root Directory**: `projects/lmodulo/api`.
4. Railway detects `api/railway.toml` automatically and uses the Dockerfile.

### 5c — Create the Frontend service

1. In the project → **New** → **GitHub Repo** → `Architectonic` (same repo again).
2. Rename the service to `lmodulo-frontend`.
3. Service → **Settings** → **Source** → **Root Directory**: `projects/lmodulo/frontend`.

---

## 6 — Generate a Session Secret

The API needs a 64-character random hex string as `SESSION_SECRET`. Run this locally:

```bash
openssl rand -hex 32
```

Copy the output. You will use it in the next step.

---

## 7 — Configure Environment Variables

### API service (`lmodulo-api`)

In Railway → `lmodulo-api` → **Variables** → add each:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `MONGO_URI` | Your Atlas connection string from Step 1 |
| `SESSION_SECRET` | 64-char hex from Step 6 |
| `FRONTEND_ORIGIN` | Leave blank for now — set after first frontend deploy |
| `APP_URL` | Leave blank for now — same as `FRONTEND_ORIGIN` |
| `STORAGE_PROVIDER` | `s3` |
| `AWS_REGION` | `auto` |
| `AWS_BUCKET` | `lmodulo-uploads` |
| `AWS_ACCESS_KEY_ID` | R2 Access Key ID from Step 3 |
| `AWS_SECRET_ACCESS_KEY` | R2 Secret Access Key from Step 3 |
| `S3_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL` | R2 public bucket URL from Step 3 |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | Resend API key from Step 4 |
| `SMTP_FROM` | `lmodulo <noreply@lmodulo.net>` |
| `APP_NAME` | `lmodulo` |

### Frontend service (`lmodulo-frontend`)

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `ORIGIN` | Leave blank for now — set after first deploy |
| `API_URL` | Leave blank for now — set after first API deploy |
| `PUBLIC_APEX_DOMAIN` | `lmodulo.net` |
| `OLLAMA_URL` | *(optional — see Step 10)* |

---

## 8 — First Deploy

### Deploy the API first

1. Railway → `lmodulo-api` → **Deploy** (or it may auto-deploy when you set variables).
2. Click **View logs** and watch the build. It takes 2–5 minutes first time.
3. When live, Railway assigns a URL like `lmodulo-api-production.up.railway.app`.
4. Open `https://lmodulo-api-production.up.railway.app/health` in your browser — you should see `{"status":"ok"}` or similar.

### Point the frontend at the API

1. Copy the Railway API URL.
2. In `lmodulo-frontend` → **Variables**:
   - `API_URL` = `https://lmodulo-api-production.up.railway.app`
3. In `lmodulo-api` → **Variables**:
   - `FRONTEND_ORIGIN` = `https://lmodulo-frontend-production.up.railway.app` *(temporarily — update after custom domains)*
   - `APP_URL` = same value

### Deploy the frontend

1. Railway → `lmodulo-frontend` → **Deploy**.
2. When live, open the Railway URL — you should see the login page.
3. Copy the frontend Railway URL.
4. In `lmodulo-frontend` → **Variables**: set `ORIGIN` = the frontend Railway URL.
5. **Redeploy** the frontend (Railway → Redeploy).

---

## 9 — Enable CI/CD Gate

This ensures Railway never deploys broken code.

1. Railway → project → **Settings** → **Deployments** → enable **"Deploy on CI check passing"** (or similar wording — the label may vary).
2. In your GitHub repo → **Settings** → **Branches** → add a branch protection rule for `main`:
   - Require status checks → search for `API tests` and `Frontend type check` (the job names from `.github/workflows/ci.yml`).
   - Enable **Require branches to be up to date before merging**.

From now on: push to `main` → GitHub Actions runs → if tests pass → Railway deploys automatically.

---

## 10 — AI Chat (Ollama) — Optional

The chat assistant is disabled if `OLLAMA_URL` is not set. To enable it in production you need a remote machine running Ollama.

### Option A — RunPod (recommended, pay per hour)

1. Sign up at [runpod.io](https://www.runpod.io).
2. **Pods** → **Deploy** → filter by GPU → choose **RTX 4090** (8GB VRAM, runs Llama 3 8B).
3. Select template **Ollama** (or search for it in the template library).
4. Set the pod to **always-on** or on-demand depending on usage.
5. Once running, copy the **public HTTP endpoint** URL.
6. In Railway `lmodulo-frontend` → **Variables**: `OLLAMA_URL` = the RunPod URL.
7. Redeploy the frontend.

**Cost:** ~$0.35/hr for RTX 4090 (around $25/mo always-on).

### Option B — Skip for now

Leave `OLLAMA_URL` unset. The chat panel will not appear. You can add it later.

---

## 11 — Custom Domains

You need Railway Pro plan for wildcard domains. Verify your plan before this step.

### 11a — Add domains in Railway

1. Railway → `lmodulo-api` → **Settings** → **Domains** → **Add custom domain** → `api.lmodulo.net`.
2. Railway shows you a CNAME record to add. Copy the **target** (e.g. `lmodulo-api-production.up.railway.app`).
3. Railway → `lmodulo-frontend` → **Settings** → **Domains** → add each:
   - `lmodulo.net`
   - `www.lmodulo.net`
   - `*.lmodulo.net`
4. For each, Railway shows a CNAME target. They will all point to the same Railway hostname.

### 11b — Add DNS records in Cloudflare

In Cloudflare → **DNS** → **Add record** for each:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `lmodulo.net` (or `@`) | Railway frontend target | Proxied (orange) |
| `CNAME` | `www` | Railway frontend target | Proxied (orange) |
| `CNAME` | `*` | Railway frontend target | DNS only (grey) ⚠️ |
| `CNAME` | `api` | Railway API target | Proxied (orange) |

> **Important:** Cloudflare cannot proxy wildcard CNAMEs — the `*` record must be set to **DNS only** (grey cloud). SSL for client subdomains is handled by Railway's own certificate.

### 11c — Update Railway env vars to use custom domains

1. `lmodulo-api` → **Variables**:
   - `FRONTEND_ORIGIN` = `https://www.lmodulo.net`
   - `APP_URL` = `https://www.lmodulo.net`
2. `lmodulo-frontend` → **Variables**:
   - `ORIGIN` = `https://www.lmodulo.net`
   - `API_URL` = `https://api.lmodulo.net`
3. Redeploy both services.

SSL certificates are issued automatically by Railway via Let's Encrypt. Allow up to 5 minutes for the wildcard cert to provision.

---

## 12 — Add Client Workspaces

Each client subdomain maps to a workspace record in MongoDB. Add one for each client.

1. Open **MongoDB Atlas** → **Browse Collections** → `appdb` database.
2. Select (or create) the `workspaces` collection.
3. **Insert Document** for each client:

```json
{
  "name": "TechFusion",
  "slug": "techfusion",
  "description": "",
  "ownerId": null,
  "createdAt": { "$date": "2026-06-03T00:00:00.000Z" },
  "updatedAt": { "$date": "2026-06-03T00:00:00.000Z" }
}
```

The `slug` field must match the subdomain exactly (`techfusion` → `techfusion.lmodulo.net`).

Once inserted, `techfusion.lmodulo.net` will automatically scope all data to that workspace for any logged-in user.

---

## 13 — Verify Everything

Work through this checklist after setup:

- [ ] `https://www.lmodulo.net` loads the login page
- [ ] Login works, dashboard loads
- [ ] File upload in Vault → file appears in R2 bucket (check Cloudflare R2 console)
- [ ] Password reset → email received at your inbox via Resend
- [ ] `https://techfusion.lmodulo.net` loads and is scoped to the techfusion workspace
- [ ] `https://api.lmodulo.net/health` returns `{"status":"ok"}`
- [ ] Push a commit to `main` → GitHub Actions runs → Railway deploys after CI passes
- [ ] *(if Ollama configured)* Chat panel opens and responds

---

## Environment Variable Quick Reference

### API service

| Variable | Source |
| --- | --- |
| `MONGO_URI` | Atlas → Connect → Drivers |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `FRONTEND_ORIGIN` | `https://www.lmodulo.net` |
| `APP_URL` | `https://www.lmodulo.net` |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 → API Token |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 → API Token |
| `S3_ENDPOINT` | `https://{ACCOUNT_ID}.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL` | Cloudflare R2 → bucket → Public access URL |
| `SMTP_PASS` | Resend → API Keys |

### Frontend service

| Variable | Source |
| --- | --- |
| `ORIGIN` | `https://www.lmodulo.net` |
| `API_URL` | `https://api.lmodulo.net` |
| `PUBLIC_APEX_DOMAIN` | `lmodulo.net` |
| `OLLAMA_URL` | RunPod public endpoint (optional) |
