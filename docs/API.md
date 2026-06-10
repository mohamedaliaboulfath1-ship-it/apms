# APMS API Design

## Base URL

```
Production: https://apms.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All endpoints require Supabase JWT via cookie or Authorization header.

```
Authorization: Bearer <supabase_access_token>
```

## Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health check |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/kpis` | Dashboard KPI metrics |
| GET | `/api/dashboard/charts` | Chart data aggregates |

### Employees

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List employees (paginated) |
| GET | `/api/employees/:id` | Employee detail + timeline |
| POST | `/api/employees` | Create employee |
| PATCH | `/api/employees/:id` | Update employee |
| GET | `/api/employees/:id/balance` | Current balance breakdown |

### Custody

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/custody/account` | Main custody account |
| GET | `/api/custody/transactions` | List transactions |
| POST | `/api/custody/transactions` | Create transfer/purchase |
| POST | `/api/custody/receive` | Receive monthly custody |

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/invoices` | List invoices (filterable) |
| GET | `/api/invoices/:id` | Invoice detail |
| POST | `/api/invoices` | Create invoice |
| POST | `/api/invoices/:id/upload` | Upload attachment |
| PATCH | `/api/invoices/:id/status` | Approve/reject/settle |

### Missing Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/missing-documents` | List missing docs |
| POST | `/api/missing-documents` | Record missing doc |
| PATCH | `/api/missing-documents/:id` | Update/resolve |

### Card & Subscriptions

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/card-transactions` | Card expense CRUD |
| GET/POST | `/api/subscriptions` | Subscription CRUD |
| GET | `/api/subscriptions/upcoming` | Upcoming renewals |

### Reconciliation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reconciliation/:year/:month` | Period reconciliation |
| POST | `/api/reconciliation/:year/:month` | Create/update reconciliation |
| POST | `/api/reconciliation/:id/finalize` | Finalize reconciliation |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/:type` | Generate report (excel/pdf/csv) |
| GET | `/api/reports/audit-package` | Full audit ZIP export |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/mark-all-read` | Mark all read |

### AI Assistant

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/assistant/chat` | Send query, get insights |

## Response Format

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  },
  "error": null
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (RBAC) |
| 404 | Not found |
| 422 | Business rule violation |
| 500 | Server error |
