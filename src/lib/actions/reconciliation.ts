'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession, requireAdmin } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getReconciliation(month: number, year: number) {
  const user = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from('reconciliations')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('period_month', month)
    .eq('period_year', year)
    .single();

  if (data) return data;

  // Auto-compute if not exists
  return computeReconciliation(month, year);
}

async function computeReconciliation(month: number, year: number) {
  const user = await requireSession();
  const supabase = await createClient();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0];

  const account = await supabase.from('custody_accounts').select('*').eq('company_id', user.company_id!).single();

  const [received, distributed, settled, direct, card, missing, totalInvoices] = await Promise.all([
    supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'main_receive').gte('transaction_date', start).lte('transaction_date', end),
    supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'employee_transfer').gte('transaction_date', start).lte('transaction_date', end),
    supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'settlement').gte('transaction_date', start).lte('transaction_date', end),
    supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'direct_purchase').gte('transaction_date', start).lte('transaction_date', end),
    supabase.from('card_transactions').select('amount').eq('company_id', user.company_id!).gte('transaction_date', start).lte('transaction_date', end),
    supabase.from('missing_documents').select('id').eq('company_id', user.company_id!).in('status', ['pending', 'overdue']),
    supabase.from('invoices').select('id, status').eq('company_id', user.company_id!).gte('invoice_date', start).lte('invoice_date', end),
  ]);

  const sum = (arr: { amount: number }[] | null) => (arr ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const receivedAmt = sum(received.data);
  const distributedAmt = sum(distributed.data);
  const settledAmt = sum(settled.data);
  const directAmt = sum(direct.data);
  const cardAmt = sum(card.data);
  const closingBalance = Number(account.data?.current_balance ?? 0);
  const openingBalance = closingBalance - receivedAmt + distributedAmt + directAmt;
  const totalInv = totalInvoices.data?.length ?? 0;
  const settledInv = totalInvoices.data?.filter((i) => i.status === 'settled').length ?? 0;
  const supportingPct = totalInv > 0 ? (settledInv / totalInv) * 100 : 0;
  const missingPct = totalInv > 0 ? ((missing.data?.length ?? 0) / totalInv) * 100 : 0;

  let status: 'green' | 'yellow' | 'red' | 'pending' = 'pending';
  if (supportingPct >= 90) status = 'green';
  else if (supportingPct >= 70) status = 'yellow';
  else status = 'red';

  return {
    period_month: month,
    period_year: year,
    opening_balance: openingBalance,
    received_custody: receivedAmt,
    total_distributed: distributedAmt,
    total_settled: settledAmt,
    direct_purchases: directAmt,
    card_purchases: cardAmt,
    closing_balance: closingBalance,
    expected_bank_balance: closingBalance,
    actual_bank_balance: null,
    supporting_docs_pct: supportingPct,
    missing_docs_pct: missingPct,
    status,
  };
}

export async function saveReconciliation(input: {
  period_month: number;
  period_year: number;
  actual_bank_balance: number;
  notes?: string;
}) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const computed = await computeReconciliation(input.period_month, input.period_year);

  const { data, error } = await supabase.from('reconciliations').upsert({
    company_id: user.company_id!,
    custody_account_id: (await supabase.from('custody_accounts').select('id').eq('company_id', user.company_id!).single()).data!.id,
    ...computed,
    actual_bank_balance: input.actual_bank_balance,
    expected_bank_balance: computed.closing_balance,
    notes: input.notes,
    reconciled_by: user.id,
    reconciled_at: new Date().toISOString(),
  }, { onConflict: 'company_id,custody_account_id,period_month,period_year' }).select().single();

  if (error) return { error: error.message };
  revalidatePath('/reconciliation');
  return { data };
}

export async function getMonthEndClosing(month: number, year: number) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('month_end_closings')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('period_month', month)
    .eq('period_year', year)
    .single();
  return data;
}

export async function updateClosingWizardStep(month: number, year: number, step: number, checklist?: Record<string, boolean>) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.from('month_end_closings').upsert({
    company_id: user.company_id!,
    period_month: month,
    period_year: year,
    wizard_step: step,
    status: step >= 5 ? 'review' : 'in_progress',
    checklist: checklist ?? {},
  }, { onConflict: 'company_id,period_month,period_year' }).select().single();

  if (error) return { error: error.message };
  revalidatePath('/reconciliation');
  return { data };
}

export async function finalizeMonthEnd(month: number, year: number) {
  const user = await requireAdmin();
  const supabase = await createClient();

  await supabase.from('month_end_closings').update({
    status: 'closed',
    closed_by: user.id,
    closed_at: new Date().toISOString(),
  }).eq('company_id', user.company_id!).eq('period_month', month).eq('period_year', year);

  await supabase.from('activity_logs').insert({
    company_id: user.company_id,
    user_id: user.id,
    activity_type: 'month_end_closed',
    description: `Closed ${month}/${year}`,
  });

  revalidatePath('/reconciliation');
  return { success: true };
}
