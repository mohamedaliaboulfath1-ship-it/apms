# APMS Deployment Guide

## Prerequisites

- [Supabase](https://supabase.com) account (free tier works for testing)
- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (free tier works)

---

## Step 1: Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** → Name: `apms-production`
3. Choose region: **Middle East** (closest to Saudi Arabia) or **Frankfurt**
4. Set a strong database password (save it)

### Run Migrations

Go to **SQL Editor** and run each file in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_extended_schema.sql
supabase/migrations/003_storage_buckets.sql
supabase/bootstrap.sql
```

### Get Credentials

Go to **Settings → API**:
- Copy **Project URL**
- Copy **anon public** key
- Copy **service_role** key (keep secret)

### Enable Auth

Go to **Authentication → Providers**:
- Enable **Email** provider
- Set **Site URL** to your Vercel domain (or `http://localhost:3000` for dev)
- Add redirect URL: `https://your-domain.vercel.app/auth/callback`

---

## Step 2: GitHub Repository

Open Terminal and run:

```bash
cd "/Users/mohamedabouelfath/Downloads/اقفال العهد/apms"
gh auth login
gh repo create apms --public --source=. --remote=origin --description "APMS - Advance & Petty Cash Management"
git add .
git commit -m "APMS production-ready v1.0"
git push -u origin main
```

---

## Step 3: Vercel Deployment

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub `apms` repository
3. Framework: **Next.js** (auto-detected)
4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

5. Click **Deploy**

---

## Step 4: First Login

1. Visit your deployed URL → `/register`
2. Create account with your email
3. In Supabase SQL Editor, promote to admin:

```sql
UPDATE users
SET role = 'super_admin',
    company_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'your@email.com';
```

4. Log in at `/login` — you'll see the full dashboard

---

## Step 5: Verify

- [ ] Dashboard loads with live KPIs (zeros initially)
- [ ] Create an employee
- [ ] Record a custody transfer
- [ ] Upload an invoice with attachment
- [ ] Export a report from Reports Center
- [ ] Employee portal works at `/portal`

---

## Local Development

```bash
cp .env.example .env.local
# Fill in Supabase credentials
npm install
npm run dev
```

Open http://localhost:3000

---

## Health Check

```
GET /api/health
→ { "status": "healthy", "service": "APMS" }
```

---

## Backup Strategy

Supabase Pro includes daily backups. For free tier:
- Export SQL weekly from Supabase Dashboard → Database → Backups
- Enable Point-in-Time Recovery on Pro plan for production

---

## Custom Domain (Optional)

1. Vercel → Project → Settings → Domains
2. Add your domain (e.g., `apms.kayan.sa`)
3. Update Supabase Auth Site URL and redirect URLs
