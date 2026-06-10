'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({
  employee_id: z.string().uuid(),
  document_date: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1),
  reason: z.string().optional(),
  expected_date: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export async function getMissingDocuments() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('missing_documents')
    .select(`*, employees (name)`)
    .eq('company_id', user.company_id!)
    .order('document_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMissingDocument(input: z.infer<typeof schema>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const parsed = schema.parse(input);

  const { data, error } = await supabase
    .from('missing_documents')
    .insert({ ...parsed, company_id: user.company_id!, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('notifications').insert({
    company_id: user.company_id!,
    user_id: user.id,
    type: 'missing_invoice',
    channel: 'in_app',
    title: 'Missing Document Recorded',
    message: `${parsed.description} - ${parsed.amount} SAR`,
    link: `/missing-invoices`,
  });

  revalidatePath('/missing-invoices');
  return { data };
}

export async function resolveMissingDocument(id: string, status: 'received' | 'waived') {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('missing_documents')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', user.company_id!);

  if (error) return { error: error.message };
  revalidatePath('/missing-invoices');
  return { success: true };
}

export async function detectMissingInvoices() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data: unsettled } = await supabase
    .from('custody_transactions')
    .select('*, employees (name, id)')
    .eq('company_id', user.company_id!)
    .eq('type', 'employee_transfer')
    .order('transaction_date', { ascending: false });

  const alerts = [];
  for (const tx of unsettled ?? []) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount_after_vat')
      .eq('employee_id', tx.employee_id)
      .in('status', ['approved', 'settled']);

    const settledTotal = (invoices ?? []).reduce((s, i) => s + Number(i.amount_after_vat), 0);
    const gap = Number(tx.amount) - settledTotal;
    if (gap > 100) {
      alerts.push({ employee: tx.employees, gap, transaction: tx });
    }
  }
  return alerts;
}
