-- APMS Phase 2-6 Extended Schema

-- Drop policies that depend on users.role before altering the column type
DROP POLICY IF EXISTS "Admin audit logs" ON audit_logs;

-- Update user roles (skip if already migrated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_old') THEN
    NULL; -- already partially migrated, skip enum recreation
  ELSIF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE user_role RENAME TO user_role_old;
    CREATE TYPE user_role AS ENUM (
      'super_admin', 'finance_manager', 'accountant', 'employee', 'auditor'
    );
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN role TYPE user_role USING
      CASE role::text
        WHEN 'admin' THEN 'super_admin'::user_role
        WHEN 'manager' THEN 'finance_manager'::user_role
        WHEN 'accountant' THEN 'accountant'::user_role
        WHEN 'employee' THEN 'employee'::user_role
        WHEN 'viewer' THEN 'auditor'::user_role
        ELSE 'employee'::user_role
      END;
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee';
    DROP TYPE user_role_old;
  END IF;
END $$;

-- Approval workflow
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'correction_requested');
CREATE TYPE approval_level AS ENUM ('level_1', 'level_2', 'level_3');

CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  level approval_level NOT NULL DEFAULT 'level_1',
  status approval_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Settlement requests (employee self-service)
CREATE TABLE settlement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Investments
CREATE TYPE investment_type AS ENUM (
  'fixed_deposit', 'mutual_fund', 'stocks', 'bonds', 'real_estate', 'other'
);

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type investment_type NOT NULL DEFAULT 'other',
  capital DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  roi DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE WHEN capital > 0 THEN ((current_value - capital) / capital * 100) ELSE 0 END
  ) STORED,
  monthly_return DECIMAL(15,2) DEFAULT 0,
  annual_return DECIMAL(15,2) DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  start_date DATE,
  maturity_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document management with versions and tags
CREATE TABLE document_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  UNIQUE(company_id, name)
);

CREATE TABLE document_tag_links (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- Extend documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT 'invoices';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Cash flow forecasts cache
CREATE TABLE cash_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  horizon_days INTEGER NOT NULL,
  current_cash DECIMAL(15,2) NOT NULL,
  expected_expenses DECIMAL(15,2) NOT NULL,
  outstanding_advances DECIMAL(15,2) NOT NULL,
  subscription_forecast DECIMAL(15,2) NOT NULL,
  investment_income DECIMAL(15,2) NOT NULL,
  projected_balance DECIMAL(15,2) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, forecast_date, horizon_days)
);

-- Month-end closing
CREATE TYPE closing_status AS ENUM ('open', 'in_progress', 'review', 'closed');

CREATE TABLE month_end_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status closing_status NOT NULL DEFAULT 'open',
  wizard_step INTEGER DEFAULT 1,
  checklist JSONB DEFAULT '{}',
  closed_by UUID REFERENCES users(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, period_month, period_year)
);

-- Duplicate invoice detection log
CREATE TABLE duplicate_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  matched_invoice_id UUID REFERENCES invoices(id),
  match_reason TEXT NOT NULL,
  similarity_score DECIMAL(5,2),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_approval_workflows_entity ON approval_workflows(entity_type, entity_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_settlement_requests_employee ON settlement_requests(employee_id);
CREATE INDEX idx_investments_company ON investments(company_id);
CREATE INDEX idx_documents_bucket ON documents(bucket);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX idx_month_end_closings_period ON month_end_closings(period_year, period_month);

-- Triggers
CREATE TRIGGER trg_investments_updated BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS for new tables
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_end_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function for user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'finance_manager', 'accountant') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies for new tables
CREATE POLICY "Company approval access" ON approval_workflows FOR ALL USING (
  company_id = get_user_company_id()
);

CREATE POLICY "Settlement requests access" ON settlement_requests FOR ALL USING (
  company_id = get_user_company_id() AND (
    is_admin_role() OR
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Company investments access" ON investments FOR ALL USING (
  company_id = get_user_company_id()
);

CREATE POLICY "Company document tags" ON document_tags FOR ALL USING (
  company_id = get_user_company_id()
);

CREATE POLICY "Company document versions" ON document_versions FOR ALL USING (
  document_id IN (SELECT id FROM documents WHERE company_id = get_user_company_id())
);

CREATE POLICY "Company forecasts" ON cash_forecasts FOR ALL USING (
  company_id = get_user_company_id()
);

CREATE POLICY "Company month end" ON month_end_closings FOR ALL USING (
  company_id = get_user_company_id()
);

CREATE POLICY "Company duplicate alerts" ON duplicate_alerts FOR ALL USING (
  company_id = get_user_company_id()
);

-- Employee-scoped invoice access
CREATE POLICY "Employee own invoices" ON invoices FOR SELECT USING (
  company_id = get_user_company_id() AND (
    is_admin_role() OR
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
);

-- Employee can insert own invoices
CREATE POLICY "Employee insert invoices" ON invoices FOR INSERT WITH CHECK (
  company_id = get_user_company_id() AND (
    is_admin_role() OR
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
);

-- Function: update employee balance on custody transaction
CREATE OR REPLACE FUNCTION update_employee_balance_on_tx()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NOT NULL THEN
    IF NEW.type = 'employee_transfer' THEN
      UPDATE employee_balances SET
        total_transferred = total_transferred + NEW.amount,
        last_activity_at = NOW(),
        settlement_percentage = CASE
          WHEN (total_transferred + NEW.amount) > 0
          THEN (total_settled / (total_transferred + NEW.amount) * 100)
          ELSE 0 END
      WHERE employee_id = NEW.employee_id;
    ELSIF NEW.type = 'employee_return' THEN
      UPDATE employee_balances SET
        total_returned = total_returned + NEW.amount,
        last_activity_at = NOW()
      WHERE employee_id = NEW.employee_id;
    ELSIF NEW.type = 'settlement' THEN
      UPDATE employee_balances SET
        total_settled = total_settled + NEW.amount,
        last_activity_at = NOW(),
        settlement_percentage = CASE
          WHEN total_transferred > 0
          THEN ((total_settled + NEW.amount) / total_transferred * 100)
          ELSE 0 END
      WHERE employee_id = NEW.employee_id;
    END IF;
  END IF;

  -- Update custody account balance
  IF NEW.type = 'main_receive' THEN
    UPDATE custody_accounts SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.custody_account_id;
  ELSIF NEW.type IN ('employee_transfer', 'direct_purchase') THEN
    UPDATE custody_accounts SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.custody_account_id;
  ELSIF NEW.type = 'employee_return' THEN
    UPDATE custody_accounts SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.custody_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custody_tx_balance AFTER INSERT ON custody_transactions
FOR EACH ROW EXECUTE FUNCTION update_employee_balance_on_tx();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recreate audit policy with updated roles
CREATE POLICY "Admin audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'finance_manager', 'accountant'))
);
