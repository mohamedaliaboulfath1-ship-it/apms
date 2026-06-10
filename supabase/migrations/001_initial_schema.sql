-- APMS: Advance & Petty Cash Management System
-- Initial Schema Migration

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'manager', 'employee', 'viewer');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE transfer_method AS ENUM ('bank_transfer', 'cash', 'card');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'settled');
CREATE TYPE payment_method AS ENUM ('custody', 'card', 'cash', 'bank_transfer');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE subscription_billing AS ENUM ('monthly', 'annual', 'quarterly');
CREATE TYPE reconciliation_status AS ENUM ('green', 'yellow', 'red', 'pending');
CREATE TYPE notification_type AS ENUM (
  'balance_overdue', 'missing_invoice', 'subscription_renewal',
  'month_end', 'pending_approval', 'unsettled_custody', 'system'
);
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'whatsapp');
CREATE TYPE document_status AS ENUM ('pending', 'received', 'waived', 'overdue');
CREATE TYPE custody_tx_type AS ENUM (
  'main_receive', 'employee_transfer', 'employee_return',
  'direct_purchase', 'settlement', 'adjustment'
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  tax_number TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'SAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  full_name_ar TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  department TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  status employee_status NOT NULL DEFAULT 'active',
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custody Accounts (main custody holder accounts)
CREATE TABLE custody_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  holder_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  holder_name TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Main Custody',
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  monthly_limit DECIMAL(15,2) DEFAULT 15000,
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Balances (computed cache, updated via triggers)
CREATE TABLE employee_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  total_transferred DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_settled DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_returned DECIMAL(15,2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(15,2) GENERATED ALWAYS AS (
    total_transferred - total_settled - total_returned
  ) STORED,
  settlement_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  code TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  tax_number TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  category_id UUID REFERENCES expense_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custody Transactions
CREATE TABLE custody_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  custody_account_id UUID NOT NULL REFERENCES custody_accounts(id),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  type custody_tx_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  transfer_method transfer_method,
  reference_number TEXT,
  reason TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  description TEXT,
  category_id UUID REFERENCES expense_categories(id),
  department TEXT,
  amount_before_vat DECIMAL(15,2) NOT NULL,
  vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_after_vat DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  payment_method payment_method NOT NULL DEFAULT 'custody',
  employee_id UUID REFERENCES employees(id),
  custody_account_id UUID REFERENCES custody_accounts(id),
  custody_transaction_id UUID REFERENCES custody_transactions(id),
  status invoice_status NOT NULL DEFAULT 'draft',
  ocr_data JSONB,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice Attachments
CREATE TABLE invoice_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  ocr_processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Missing Document Records
CREATE TABLE missing_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  custody_transaction_id UUID REFERENCES custody_transactions(id),
  document_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  reason TEXT,
  expected_date DATE,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  reminder_frequency INTEGER DEFAULT 7,
  manager_notes TEXT,
  status document_status NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card Transactions
CREATE TABLE card_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL DEFAULT 'Corporate Card',
  transaction_date DATE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT,
  description TEXT,
  category_id UUID REFERENCES expense_categories(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_id UUID,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  billing_cycle subscription_billing NOT NULL DEFAULT 'monthly',
  monthly_cost DECIMAL(15,2),
  annual_cost DECIMAL(15,2),
  renewal_date DATE NOT NULL,
  owner_id UUID REFERENCES users(id),
  owner_name TEXT,
  payment_method payment_method NOT NULL DEFAULT 'card',
  status subscription_status NOT NULL DEFAULT 'active',
  auto_renewal BOOLEAN NOT NULL DEFAULT TRUE,
  alert_days_before INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settlements
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  invoice_id UUID REFERENCES invoices(id),
  custody_transaction_id UUID REFERENCES custody_transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliations
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  custody_account_id UUID NOT NULL REFERENCES custody_accounts(id),
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  received_custody DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_distributed DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_settled DECIMAL(15,2) NOT NULL DEFAULT 0,
  direct_purchases DECIMAL(15,2) NOT NULL DEFAULT 0,
  card_purchases DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_bank_balance DECIMAL(15,2),
  actual_bank_balance DECIMAL(15,2),
  difference DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(actual_bank_balance, 0) - COALESCE(expected_bank_balance, 0)
  ) STORED,
  supporting_docs_pct DECIMAL(5,2) DEFAULT 0,
  missing_docs_pct DECIMAL(5,2) DEFAULT 0,
  status reconciliation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, custody_account_id, period_month, period_year)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents (generic file storage metadata)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  entity_type TEXT,
  entity_id UUID,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reminder_date TIMESTAMPTZ NOT NULL,
  frequency_days INTEGER,
  message TEXT NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, key)
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_custody_tx_company ON custody_transactions(company_id);
CREATE INDEX idx_custody_tx_employee ON custody_transactions(employee_id);
CREATE INDEX idx_custody_tx_date ON custody_transactions(transaction_date);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_employee ON invoices(employee_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_missing_docs_employee ON missing_documents(employee_id);
CREATE INDEX idx_missing_docs_status ON missing_documents(status);
CREATE INDEX idx_card_tx_company ON card_transactions(company_id);
CREATE INDEX idx_card_tx_date ON card_transactions(transaction_date);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(renewal_date);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id, created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_custody_accounts_updated BEFORE UPDATE ON custody_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_missing_docs_updated BEFORE UPDATE ON missing_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reconciliations_updated BEFORE UPDATE ON reconciliations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Employee balance auto-create on employee insert
CREATE OR REPLACE FUNCTION create_employee_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_balances (employee_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employee_balance AFTER INSERT ON employees FOR EACH ROW EXECUTE FUNCTION create_employee_balance();

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (company_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER trg_audit_custody_tx AFTER INSERT OR UPDATE OR DELETE ON custody_transactions FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_settlements AFTER INSERT OR UPDATE OR DELETE ON settlements FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER trg_audit_reconciliations AFTER INSERT OR UPDATE OR DELETE ON reconciliations FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (company-scoped access)
CREATE POLICY "Users can view own company data" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company users access" ON employees FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company custody access" ON custody_accounts FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company custody tx access" ON custody_transactions FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company invoices access" ON invoices FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company missing docs access" ON missing_documents FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company card tx access" ON card_transactions FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company subscriptions access" ON subscriptions FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Company reconciliations access" ON reconciliations FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "User notifications access" ON notifications FOR ALL USING (
  user_id = auth.uid()
);

CREATE POLICY "Admin audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
);
