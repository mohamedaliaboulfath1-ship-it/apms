'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const custodyTxSchema = z.object({
  custody_account_id: z.string().uuid(),
  employee_id: z.string().uuid().optional(),
  type: z.enum(['main_receive', 'employee_transfer', 'employee_return', 'direct_purchase', 'settlement', 'adjustment']),
  amount: z.number().positive(),
  transfer_method: z.enum(['bank_transfer', 'cash', 'card']).optional(),
  reference_number: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string(),
});

export async function getCustodyAccount() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from('custody_accounts')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('is_active', true)
    .single();

  return data;
}

export async function getCustodyTransactions(filters?: { type?: string; employee_id?: string }) {
  const user = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from('custody_transactions')
    .select(`*, employees (name)`)
    .eq('company_id', user.company_id!)
    .order('transaction_date', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCustodyTransaction(input: z.infer<typeof custodyTxSchema>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const parsed = custodyTxSchema.parse(input);

  const { data, error } = await supabase
    .from('custody_transactions')
    .insert({
      ...parsed,
      company_id: user.company_id!,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('activity_logs').insert({
    company_id: user.company_id,
    user_id: user.id,
    activity_type: 'custody_transaction',
    description: `${parsed.type}: ${parsed.amount} SAR`,
    metadata: { transaction_id: data.id },
  });

  revalidatePath('/custody');
  revalidatePath('/');
  revalidatePath('/wealth');
  return { data };
}

export async function receiveMonthlyCustody(amount: number, reference?: string) {
  const account = await getCustodyAccount();
  if (!account) return { error: 'No custody account found' };

  return createCustodyTransaction({
    custody_account_id: account.id,
    type: 'main_receive',
    amount,
    transfer_method: 'bank_transfer',
    reference_number: reference,
    reason: 'Monthly operating custody',
    transaction_date: new Date().toISOString().split('T')[0],
  });
}
