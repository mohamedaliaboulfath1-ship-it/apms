-- APMS Bootstrap: Run AFTER migrations on a fresh Supabase project
-- Creates default company, custody account, categories, and links first admin

INSERT INTO companies (id, name, name_ar, currency, tax_number)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Kayan Environmental Services', 'كيان للخدمات البيئية', 'SAR', '300000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories (company_id, name, name_ar, code, color) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Equipment', 'معدات', 'EQP', '#6366f1'),
  ('a0000000-0000-0000-0000-000000000001', 'Transport', 'نقل', 'TRN', '#8b5cf6'),
  ('a0000000-0000-0000-0000-000000000001', 'Maintenance', 'صيانة', 'MNT', '#a855f7'),
  ('a0000000-0000-0000-0000-000000000001', 'Office Supplies', 'مستلزمات', 'OFF', '#d946ef'),
  ('a0000000-0000-0000-0000-000000000001', 'Software', 'برمجيات', 'SW', '#ec4899'),
  ('a0000000-0000-0000-0000-000000000001', 'Infrastructure', 'بنية تحتية', 'INF', '#f43f5e')
ON CONFLICT DO NOTHING;

INSERT INTO custody_accounts (id, company_id, holder_name, name, current_balance, monthly_limit)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mohamed Ali', 'Main Operating Custody', 0, 15000)
ON CONFLICT DO NOTHING;

-- After creating your admin user via /register, run this to promote them:
-- UPDATE users SET role = 'super_admin', company_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'your@email.com';
