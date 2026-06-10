# APMS Database Guide

## Overview

APMS uses **PostgreSQL via Supabase** with 30+ tables, Row Level Security (RLS), audit triggers, and generated columns for financial accuracy.

## Migration Order

Run in Supabase SQL Editor in this exact order:

1. `supabase/migrations/001_initial_schema.sql` — Core tables, RLS, audit
2. `supabase/migrations/002_extended_schema.sql` — Investments, approvals, forecasts, roles
3. `supabase/migrations/003_storage_buckets.sql` — File storage buckets + policies
4. `supabase/bootstrap.sql` — Default company (Kayan Environmental Services)
5. `supabase/seed.sql` — Optional sample employees

## Storage Buckets

| Bucket | Purpose | Max Size |
|--------|---------|----------|
| `invoices` | Invoice PDFs, images, Excel | 50MB |
| `employee-documents` | Employee supporting docs | 50MB |
| `contracts` | Vendor/company contracts | 50MB |
| `subscriptions` | Subscription receipts | 10MB |
| `card-expenses` | Card expense receipts | 50MB |

File path pattern: `{company_id}/{entity_type}/{entity_id}/{timestamp}.{ext}`

## Core Tables

### Financial
- `custody_accounts` — Main custody holder balance
- `custody_transactions` — All money movements (auto-updates balances)
- `employee_balances` — Computed: transferred − settled − returned
- `invoices` — Full VAT-aware invoice records
- `settlements` — Invoice settlement links
- `reconciliations` — Month-end reconciliation with bank comparison

### Control
- `approval_workflows` — Multi-level approval tracking
- `settlement_requests` — Employee self-service requests
- `missing_documents` — Missing invoice workflow
- `duplicate_alerts` — Auto-detected duplicate invoices
- `month_end_closings` — Closing wizard state

### Treasury
- `investments` — Portfolio with auto-computed ROI
- `subscriptions` — Recurring cost tracking
- `card_transactions` — Corporate card expenses
- `cash_forecasts` — 30/90/180/365 day projections

### System
- `users` — RBAC roles linked to auth.users
- `audit_logs` — Automatic on financial table changes
- `activity_logs` — User action tracking
- `notifications` — In-app alert system
- `documents` + `document_versions` — File archive with versioning

## Roles (RLS)

| Role | Access |
|------|--------|
| `super_admin` | Full access |
| `finance_manager` | All financial + settings |
| `accountant` | CRUD financial data |
| `employee` | Own balance, submit invoices |
| `auditor` | Read-only all data |

## Balance Formula (Enforced by Triggers)

```
employee_balances.outstanding_balance = total_transferred - total_settled - total_returned
```

Custody account balance updates automatically on every `custody_transactions` insert.

## First Admin Setup

After registering at `/register`:

```sql
UPDATE users
SET role = 'super_admin',
    company_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'mohamed@kayan.sa';
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (server only, never expose)
```
