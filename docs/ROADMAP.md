# APMS Development Roadmap

## MVP (Phase 1) — 4 Weeks ✅ Foundation Built

- [x] Project scaffolding (Next.js + Supabase + shadcn/ui)
- [x] Database schema with RLS and audit logging
- [x] Executive Dashboard with KPIs and charts
- [x] Employee Management module
- [x] Custody Management module
- [x] Invoice Management module
- [x] Missing Invoice Workflow
- [x] Card Expense Management
- [x] Subscription Management
- [x] Wealth Monitor
- [x] Reconciliation Center
- [x] Reports Center (UI)
- [x] Notification Engine (UI)
- [x] AI Assistant (demo mode)
- [x] Settings module
- [x] Dark/Light/System theme
- [x] Demo data layer

## Phase 2 — Supabase Integration (2 Weeks)

- [ ] Connect Supabase Auth (login/signup)
- [ ] Wire all modules to live database
- [ ] File upload to Supabase Storage
- [ ] Real-time balance updates
- [ ] Server Actions for CRUD operations
- [ ] Pagination and search (server-side)
- [ ] Seed data for Kayan Environmental Services

## Phase 3 — Advanced Features (3 Weeks)

- [ ] Invoice OCR integration
- [ ] Email notification delivery (Resend)
- [ ] Report generation (Excel/PDF)
- [ ] Audit package export
- [ ] Employee detail page with timeline
- [ ] Drag-and-drop invoice upload
- [ ] Form validation and optimistic updates
- [ ] WhatsApp notification architecture

## Phase 4 — Production Hardening (2 Weeks)

- [ ] Full RBAC enforcement
- [ ] Error monitoring (Sentry)
- [ ] Performance optimization (Lighthouse 90+)
- [ ] E2E tests (Playwright)
- [ ] Backup strategy documentation
- [ ] Multi-company support
- [ ] Arabic RTL localization
- [ ] AI Assistant with LLM integration

## Phase 5 — SaaS Readiness (3 Weeks)

- [ ] Multi-tenant onboarding flow
- [ ] Billing/subscription (Stripe)
- [ ] Admin panel for super-admins
- [ ] API documentation (OpenAPI)
- [ ] Customer support module
- [ ] White-label customization
- [ ] Mobile-responsive polish
- [ ] Marketing landing page

## Production Plan

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel Pro | Frontend hosting, edge functions |
| Supabase Pro | Database, auth, storage, realtime |
| Resend | Email notifications |
| Sentry | Error monitoring |
| GitHub Actions | CI/CD pipeline |

### Deployment Checklist

1. Create Supabase project → run migrations
2. Create GitHub repo → push code
3. Connect Vercel → set env vars
4. Configure custom domain
5. Enable Supabase RLS policies
6. Set up backup schedule (daily)
7. Configure health check monitoring
8. Load seed data for production company

### Environment Variables (Production)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
RESEND_API_KEY (optional)
SENTRY_DSN (optional)
```
