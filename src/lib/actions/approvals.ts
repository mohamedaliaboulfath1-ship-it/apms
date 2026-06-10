'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession, requireAdmin } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getPendingApprovals() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const enriched = await Promise.all(
    (data ?? []).map(async (approval) => {
      if (approval.entity_type === 'invoice') {
        const { data: inv } = await supabase
          .from('invoices')
          .select('*, employees(name)')
          .eq('id', approval.entity_id)
          .single();
        return { ...approval, entity: inv };
      }
      if (approval.entity_type === 'settlement_request') {
        const { data: req } = await supabase
          .from('settlement_requests')
          .select('*, employees(name)')
          .eq('id', approval.entity_id)
          .single();
        return { ...approval, entity: req };
      }
      return approval;
    })
  );

  return enriched;
}

export async function processApproval(
  id: string,
  action: 'approved' | 'rejected' | 'correction_requested',
  comments?: string
) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: approval } = await supabase.from('approval_workflows').select('*').eq('id', id).single();
  if (!approval) return { error: 'Not found' };

  await supabase.from('approval_workflows').update({
    status: action,
    approved_by: user.id,
    comments,
    resolved_at: new Date().toISOString(),
  }).eq('id', id);

  if (approval.entity_type === 'invoice') {
    const { updateInvoiceStatus } = await import('@/lib/actions/invoices');
    await updateInvoiceStatus(approval.entity_id, action === 'correction_requested' ? 'correction_requested' : action);
  }

  if (approval.entity_type === 'settlement_request') {
    await supabase.from('settlement_requests').update({
      status: action,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: comments,
    }).eq('id', approval.entity_id);
  }

  revalidatePath('/approvals');
  return { success: true };
}

export async function createSettlementRequest(input: {
  amount: number;
  description: string;
  invoice_id?: string;
}) {
  const user = await requireSession();
  const supabase = await createClient();

  const { data: employee } = await supabase.from('employees').select('id').eq('user_id', user.id).single();
  if (!employee) return { error: 'Employee profile not found' };

  const { data, error } = await supabase.from('settlement_requests').insert({
    company_id: user.company_id!,
    employee_id: employee.id,
    amount: input.amount,
    description: input.description,
    invoice_id: input.invoice_id,
    status: 'pending',
  }).select().single();

  if (error) return { error: error.message };

  await supabase.from('approval_workflows').insert({
    company_id: user.company_id!,
    entity_type: 'settlement_request',
    entity_id: data.id,
    requested_by: user.id,
    status: 'pending',
  });

  revalidatePath('/portal/settlements');
  revalidatePath('/approvals');
  return { data };
}

export async function getSettlementRequests(employeeId?: string) {
  const user = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from('settlement_requests')
    .select('*, employees(name)')
    .eq('company_id', user.company_id!)
    .order('created_at', { ascending: false });

  if (employeeId) query = query.eq('employee_id', employeeId);
  else if (user.role === 'employee') {
    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', user.id).single();
    if (emp) query = query.eq('employee_id', emp.id);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getAuditLogs(limit = 50) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('*, users(full_name)')
    .eq('company_id', user.company_id!)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
