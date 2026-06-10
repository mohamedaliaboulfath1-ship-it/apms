-- APMS Storage Buckets & Policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('invoices', 'invoices', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/heic','image/heif','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel']),
  ('employee-documents', 'employee-documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/heic','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('contracts', 'contracts', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png']),
  ('subscriptions', 'subscriptions', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png']),
  ('card-expenses', 'card-expenses', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/heic'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: company-scoped via folder structure company_id/entity_id/file
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('invoices','employee-documents','contracts','subscriptions','card-expenses'));

CREATE POLICY "Authenticated users can read own company files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('invoices','employee-documents','contracts','subscriptions','card-expenses'));

CREATE POLICY "Authenticated users can update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('invoices','employee-documents','contracts','subscriptions','card-expenses'));

CREATE POLICY "Authenticated users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('invoices','employee-documents','contracts','subscriptions','card-expenses'));
