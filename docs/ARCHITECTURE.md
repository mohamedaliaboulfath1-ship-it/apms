# APMS Architecture

## System Overview

APMS (Advance & Petty Cash Management System) is an independent, enterprise-grade custody control platform designed for companies managing employee advances and petty cash operations.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Next.js 16 App Router · React 19 · Server Components       │
│  shadcn/ui · Framer Motion · Recharts · Tailwind CSS v4     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  Route Handlers (API) · Server Actions · Middleware          │
│  Auth (Supabase) · RBAC · Validation (Zod)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       DATA LAYER                             │
│  Supabase PostgreSQL · Row Level Security · Realtime         │
│  Supabase Storage (documents) · Audit Logging                │
└─────────────────────────────────────────────────────────────┘
```

## Core Business Flow

```
Company Bank → Main Custody (Mohamed Ali)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Employee A   Employee B   Direct Purchase
        │           │           │
        ▼           ▼           ▼
   Invoices     Invoices    Receipt
        │           │
        ▼           ▼
   Settlement   Missing Doc Workflow
        │
        ▼
   Reconciliation (Month-End)
```

## Balance Formula

```
Employee Balance = Transferred Amount − Settled Invoices − Returned Cash
Custody Balance  = Received − Distributed − Direct Purchases − Settlements
```

## Security Model

| Role | Permissions |
|------|------------|
| Admin | Full access, user management, settings |
| Accountant | All financial operations, reconciliation |
| Manager | View all, approve invoices, manage employees |
| Employee | View own balance, submit invoices |
| Viewer | Read-only dashboard and reports |

## Deployment Architecture

```
GitHub → Vercel (Frontend + API Routes)
              │
              ▼
         Supabase Cloud
         ├── PostgreSQL (RLS)
         ├── Auth
         ├── Storage (documents)
         └── Edge Functions (notifications)
```

## Performance Strategy

- Server Components for initial page loads
- Client Components only for interactivity
- Pagination on all list views
- Optimistic updates for form submissions
- Skeleton loading states
- Code splitting per module route
- Supabase query optimization with indexes

## File Storage

Documents stored in Supabase Storage buckets:
- `invoices/` — PDF, JPG, PNG, HEIC, Excel
- `attachments/` — Supporting documents
- `reports/` — Generated exports

OCR-ready: `invoice_attachments.ocr_processed` flag + `invoices.ocr_data` JSONB field.
