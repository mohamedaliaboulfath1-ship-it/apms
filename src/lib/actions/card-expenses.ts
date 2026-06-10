'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const cardSchema = z.object({
  card_name: z.string().default('Corporate Card'),
  transaction_date: z.string(),
  vendor_name: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  is_subscription: z.boolean().default(false),
  reference_number: z.string().optional(),
});

export async function getCardTransactions() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('card_transactions')
    .select('*')
    .eq('company_id', user.company_id!)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCardTransaction(input: z.infer<typeof cardSchema>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const parsed = cardSchema.parse(input);

  const { data, error } = await supabase
    .from('card_transactions')
    .insert({ ...parsed, company_id: user.company_id!, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/card-expenses');
  revalidatePath('/');
  return { data };
}

export async function deleteCardTransaction(id: string) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('card_transactions').delete().eq('id', id).eq('company_id', user.company_id!);
  if (error) return { error: error.message };
  revalidatePath('/card-expenses');
  return { success: true };
}

export async function getCardSpendingSummary() {
  const user = await requireSession();
  const supabase = await createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data } = await supabase
    .from('card_transactions')
    .select('amount, is_subscription, transaction_date')
    .eq('company_id', user.company_id!)
    .gte('transaction_date', startOfMonth);

  const total = (data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const subscription = (data ?? []).filter((t) => t.is_subscription).reduce((s, t) => s + Number(t.amount), 0);
  return { total, subscription, count: data?.length ?? 0 };
}
