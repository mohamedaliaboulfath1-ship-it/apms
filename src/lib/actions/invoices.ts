'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession, getEmployeeId } from '@/lib/auth/session';
import { canApprove, type UserRole } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const invoiceSchema = z.object({
  invoice_number: z.string().min(1),
  invoice_date: z.string(),
  vendor_name: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  department: z.string().optional(),
  amount_before_vat: z.number().positive(),
  vat_amount: z.number().min(0),
  amount_after_vat: z.number().positive(),
  payment_method: z.enum(['custody', 'card', 'cash', 'bank_transfer']).default('custody'),
  employee_id: z.string().uuid().optional(),
  custody_account_id: z.string().uuid().optional(),
});

export async function getInvoices(filters?: { status?: string; employee_id?: string }) {
  const user = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select(`*, employees (name), invoice_attachments (*)`)
    .eq('company_id', user.company_id!)
    .order('invoice_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
  else if (user.role === 'employee') {
    const empId = await getEmployeeId(user.id);
    if (empId) query = query.eq('employee_id', empId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInvoice(id: string) {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(`*, employees (name), invoice_attachments (*), expense_categories (name)`)
    .eq('id', id)
    .eq('company_id', user.company_id!)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createInvoice(input: z.infer<typeof invoiceSchema>) {
  const user = await requireSession();
  const supabase = await createClient();
  const parsed = invoiceSchema.parse(input);

  if (user.role === 'employee') {
    const empId = await getEmployeeId(user.id);
    if (empId) parsed.employee_id = empId;
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...parsed,
      company_id: user.company_id!,
      created_by: user.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Check duplicates
  await checkDuplicateInvoice(data.id, user.company_id!);

  await supabase.from('approval_workflows').insert({
    company_id: user.company_id!,
    entity_type: 'invoice',
    entity_id: data.id,
    requested_by: user.id,
    status: 'pending',
  });

  revalidatePath('/invoices');
  revalidatePath('/portal/invoices');
  revalidatePath('/approvals');
  return { data };
}

export async function updateInvoiceStatus(
  id: string,
  status: 'approved' | 'rejected' | 'settled' | 'correction_requested',
  comments?: string
) {
  const user = await requireSession();
  if (!canApprove(user.role as UserRole)) return { error: 'Forbidden' };

  const supabase = await createClient();
  const updates: Record<string, unknown> = {
    status: status === 'correction_requested' ? 'pending' : status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (status === 'settled') updates.settled_at = new Date().toISOString();

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('company_id', user.company_id!);

  if (error) return { error: error.message };

  await supabase.from('approval_workflows').insert({
    company_id: user.company_id!,
    entity_type: 'invoice',
    entity_id: id,
    approved_by: user.id,
    status: status === 'correction_requested' ? 'correction_requested' : status === 'rejected' ? 'rejected' : 'approved',
    comments,
  });

  if (status === 'approved' || status === 'settled') {
    const { data: inv } = await supabase.from('invoices').select('employee_id, amount_after_vat').eq('id', id).single();
    if (inv?.employee_id) {
      const account = await supabase.from('custody_accounts').select('id').eq('company_id', user.company_id!).single();
      if (account.data) {
        await supabase.from('custody_transactions').insert({
          company_id: user.company_id!,
          custody_account_id: account.data.id,
          employee_id: inv.employee_id,
          type: 'settlement',
          amount: inv.amount_after_vat,
          transaction_date: new Date().toISOString().split('T')[0],
          created_by: user.id,
          reason: `Settlement for invoice ${id}`,
        });
      }
    }
  }

  revalidatePath('/invoices');
  revalidatePath('/approvals');
  revalidatePath('/');
  return { success: true };
}

async function checkDuplicateInvoice(invoiceId: string, companyId: string) {
  const supabase = await createClient();
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
  if (!invoice) return;

  const { data: matches } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_after_vat')
    .eq('company_id', companyId)
    .neq('id', invoiceId)
    .or(`invoice_number.eq.${invoice.invoice_number},and(amount_after_vat.eq.${invoice.amount_after_vat},vendor_name.eq.${invoice.vendor_name})`);

  for (const match of matches ?? []) {
    await supabase.from('duplicate_alerts').insert({
      company_id: companyId,
      invoice_id: invoiceId,
      matched_invoice_id: match.id,
      match_reason: match.invoice_number === invoice.invoice_number ? 'Same invoice number' : 'Same amount and vendor',
      similarity_score: match.invoice_number === invoice.invoice_number ? 100 : 75,
    });
  }
}

export async function getDuplicateAlerts() {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('duplicate_alerts')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('is_resolved', false);
  return data ?? [];
}
