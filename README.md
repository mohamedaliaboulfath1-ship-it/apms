# APMS — Advance & Petty Cash Management System

Enterprise-grade custody control and reconciliation platform for managing employee advances, petty cash, invoices, and month-end reconciliation.

## Quick Start

```bash
cd apms
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| UI | shadcn/ui, Framer Motion, Recharts, Lucide |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Deployment | Vercel + Supabase |

## Modules

- **Executive Dashboard** — KPIs, interactive charts, real-time overview
- **Employee Management** — Balances, risk scores, settlement tracking
- **Custody Management** — Transfers, distributions, direct purchases
- **Invoice Management** — Upload, review, approve, settle (OCR-ready)
- **Missing Invoice Workflow** — Track undocumented expenses
- **Card Expense Management** — Corporate card tracking
- **Subscription Management** — Renewal alerts, cost trends
- **Wealth Monitor** — Cash position and forecasting
- **Reconciliation Center** — Month-end closing with status indicators
- **Reports Center** — Excel, PDF, CSV, Audit Package exports
- **Notification Engine** — In-app, email-ready, WhatsApp-ready
- **AI Financial Assistant** — Natural language queries

## Project Structure

```
apms/
├── docs/                    # Architecture, API, ERD, Roadmap
├── supabase/
│   └── migrations/          # PostgreSQL schema + RLS
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # All module pages
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── charts/          # Recharts wrappers
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── layout/          # Sidebar, header
│   │   ├── shared/          # DataTable, module views
│   │   └── ui/              # shadcn/ui components
│   └── lib/
│       ├── data/            # Demo data (dev mode)
│       ├── supabase/        # Supabase clients
│       └── types/           # TypeScript types
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Copy URL and anon key to `.env.local`
4. Enable Row Level Security (already configured in migration)

## GitHub Setup

```bash
gh auth login
gh repo create apms --public --source=. --remote=origin
git push -u origin main
```

## Vercel Deployment

```bash
npx vercel
```

Set environment variables from `.env.example` in Vercel dashboard.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema & ERD](./docs/DATABASE.md)
- [API Design](./docs/API.md)
- [Development Roadmap](./docs/ROADMAP.md)

## License

Proprietary — Kayan Environmental Services / Monitoring Systems Technical Consultancy
