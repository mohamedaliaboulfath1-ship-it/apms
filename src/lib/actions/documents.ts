'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession, requireAdmin } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export type StorageBucket = 'invoices' | 'employee-documents' | 'contracts' | 'subscriptions' | 'card-expenses';

const ALLOWED_TYPES = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export async function uploadDocument(formData: FormData) {
  const user = await requireSession();
  const supabase = await createClient();

  const file = formData.get('file') as File;
  const bucket = (formData.get('bucket') as StorageBucket) || 'invoices';
  const entityType = formData.get('entity_type') as string;
  const entityId = formData.get('entity_id') as string;
  const title = formData.get('title') as string;
  const tags = formData.get('tags') as string;

  if (!file || file.size === 0) return { error: 'No file provided' };
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|heic|xlsx|xls)$/i)) {
    return { error: 'File type not allowed' };
  }
  if (file.size > 50 * 1024 * 1024) return { error: 'File too large (max 50MB)' };

  const ext = file.name.split('.').pop();
  const path = `${user.company_id}/${entityType}/${entityId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return { error: uploadError.message };

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      company_id: user.company_id!,
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      bucket,
      title: title || file.name,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (docError) return { error: docError.message };

  await supabase.from('document_versions').insert({
    document_id: doc.id,
    version_number: 1,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: user.id,
  });

  if (entityType === 'invoice') {
    await supabase.from('invoice_attachments').insert({
      invoice_id: entityId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      is_primary: true,
    });
  }

  revalidatePath('/documents');
  revalidatePath('/invoices');
  return { data: doc, path };
}

export async function uploadNewVersion(documentId: string, formData: FormData) {
  const user = await requireSession();
  const supabase = await createClient();
  const file = formData.get('file') as File;

  const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).single();
  if (!doc) return { error: 'Document not found' };

  const newVersion = (doc.current_version ?? 1) + 1;
  const ext = file.name.split('.').pop();
  const path = `${user.company_id}/${doc.entity_type}/${doc.entity_id}/v${newVersion}_${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(doc.bucket).upload(path, buffer, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  await supabase.from('document_versions').insert({
    document_id: documentId,
    version_number: newVersion,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: user.id,
    change_notes: formData.get('change_notes') as string,
  });

  await supabase.from('documents').update({
    current_version: newVersion,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
  }).eq('id', documentId);

  revalidatePath('/documents');
  return { success: true, version: newVersion };
}

export async function getDocuments(filters?: { bucket?: string; search?: string; entity_type?: string }) {
  const user = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from('documents')
    .select(`*, document_versions (*)`)
    .eq('company_id', user.company_id!)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (filters?.bucket) query = query.eq('bucket', filters.bucket);
  if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDocumentVersions(documentId: string) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  return data ?? [];
}

export async function getDownloadUrl(documentId: string) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).eq('company_id', user.company_id!).single();
  if (!doc) return { error: 'Not found' };

  const { data } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.file_path, 3600);
  return { url: data?.signedUrl };
}

export async function deleteDocument(documentId: string) {
  const user = await requireAdmin();
  const supabase = await createClient();
  await supabase.from('documents').update({ is_archived: true }).eq('id', documentId);
  revalidatePath('/documents');
  return { success: true };
}

export async function tagDocument(documentId: string, tags: string[]) {
  const user = await requireSession();
  const supabase = await createClient();
  await supabase.from('documents').update({ tags }).eq('id', documentId).eq('company_id', user.company_id!);
  revalidatePath('/documents');
  return { success: true };
}
