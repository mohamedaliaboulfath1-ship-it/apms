-- APMS Seed Data for Kayan Environmental Services

-- Company
INSERT INTO companies (id, name, name_ar, currency) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Kayan Environmental Services', 'كيان للخدمات البيئية', 'SAR'),
  ('a0000000-0000-0000-0000-000000000002', 'Monitoring Systems Technical Consultancy', 'مونitoring Systems', 'SAR');

-- Expense Categories
INSERT INTO expense_categories (company_id, name, name_ar, code, color) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Equipment', 'معدات', 'EQP', '#6366f1'),
  ('a0000000-0000-0000-0000-000000000001', 'Transport', 'نقل', 'TRN', '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Maintenance', 'صيانة', 'MNT', '#a855f7'),
  ('a0000000-0000-0000-0000-000000000001', 'Office Supplies', 'مستلزمات مكتبية', 'OFF', '#d946ef'),
  ('a0000000-0000-0000-0000-000000000001', 'Software', 'برمجيات', 'SW', '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Infrastructure', 'بنية تحتية', 'INF', '#f43f5e');

-- Custody Account
INSERT INTO custody_accounts (id, company_id, holder_name, name, current_balance, monthly_limit) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mohamed Ali', 'Main Operating Custody', 8420.50, 15000);

-- Employees
INSERT INTO employees (id, company_id, name, name_ar, department, position, email, status, risk_score) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ahmed Al-Rashid', 'أحمد الرashid', 'Operations', 'Field Supervisor', 'ahmed@kayan.sa', 'active', 72),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sara Al-Mutairi', 'سارة المطيري', 'Monitoring', 'Technical Analyst', 'sara@kayan.sa', 'active', 45),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Khalid Al-Otaibi', 'خالد العتيبي', 'Logistics', 'Logistics Coordinator', 'khalid@kayan.sa', 'active', 88),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Fatima Al-Harbi', 'فاطمة الحربي', 'Administration', 'Office Manager', 'fatima@kayan.sa', 'active', 25),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Omar Al-Dossary', 'عمر الدوسري', 'Field Services', 'Technician', 'omar@kayan.sa', 'active', 91);

-- Settings
INSERT INTO settings (company_id, key, value) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'monthly_custody_amount', '5000'),
  ('a0000000-0000-0000-0000-000000000001', 'max_custody_amount', '15000'),
  ('a0000000-0000-0000-0000-000000000001', 'default_currency', '"SAR"'),
  ('a0000000-0000-0000-0000-000000000001', 'vat_rate', '0.15'),
  ('a0000000-0000-0000-0000-000000000001', 'settlement_reminder_days', '7'),
  ('a0000000-0000-0000-0000-000000000001', 'reconciliation_target_pct', '90');
