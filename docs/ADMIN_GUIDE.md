# APMS Admin Guide

## For Mohamed Ali — Finance Manager / Custody Holder

This guide covers daily operations without any technical knowledge required.

---

## Daily Workflow

### 1. Receive Monthly Custody
When the bank transfers your operating advance (typically 5,000–15,000 SAR):
- Go to **Custody** → **New Transfer**
- Type: **Main Receive**
- Enter amount and bank reference number

### 2. Distribute to Employees
When giving money to an employee:
- Go to **Custody** → **New Transfer**
- Type: **Employee Transfer**
- Select employee, amount, method (bank/cash)

### 3. Review Invoices
Employees submit invoices via the **Employee Portal** or you add them directly:
- Go to **Invoices** or **Approvals**
- Review attached documents
- Click **Approve**, **Reject**, or **Request Fix**
- Approved invoices automatically create settlement transactions

### 4. Track Missing Documents
When an employee spends without an invoice:
- Go to **Missing Docs** → **Record Missing Doc**
- Set risk level and expected date
- System sends automatic reminders

### 5. Month-End Closing
At month end:
- Go to **Reconciliation**
- Follow the 5-step wizard
- Enter actual bank balance
- System shows Green/Yellow/Red status
- Click **Finalize Month-End Closing**

---

## Module Reference

| Module | What It Does |
|--------|-------------|
| Dashboard | Live KPIs — click any card to drill down |
| Employees | View balances, risk scores, settlement % |
| Custody | All money in/out of your custody |
| Invoices | Upload, review, settle invoices |
| Missing Docs | Track undocumented expenses |
| Card Expenses | Corporate debit card purchases |
| Subscriptions | Recurring services (Microsoft, AWS, etc.) |
| Investments | Portfolio tracking with ROI |
| Wealth Monitor | Cash position + 30/90/180/365 day forecast |
| Reconciliation | Month-end bank matching |
| Approvals | Pending invoice/settlement queue |
| Documents | Searchable file archive |
| Reports | Export Excel/PDF/CSV from live data |
| AI Assistant | Ask questions in plain language |

---

## Employee Portal

Employees access `/portal` to:
- View their custody balance
- Upload invoices with attachments
- Submit settlement requests
- Track approval status

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Open command palette (search anything) |

---

## Roles You Can Assign

After employees register, promote them in Supabase:

```sql
-- Make someone an accountant
UPDATE users SET role = 'accountant' WHERE email = 'accountant@kayan.sa';

-- Link employee to user account
UPDATE employees SET user_id = (SELECT id FROM users WHERE email = 'employee@kayan.sa')
WHERE name = 'Ahmed Al-Rashid';
```

---

## Alerts You'll Receive

- Employee balance overdue (>7 days unsettled)
- Missing document overdue
- Subscription renewal approaching
- Month-end closing reminder (5 days before)
- Duplicate invoice detected

---

## Support

For issues, check `/setup` page or contact your system administrator.
