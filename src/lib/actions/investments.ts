'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const investmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['fixed_deposit', 'mutual_fund', 'stocks', 'bonds', 'real_estate', 'other']),
  capital: z.number().positive(),
  current_value: z.number().positive(),
  monthly_return: z.number().default(0),
  annual_return: z.number().default(0),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  start_date: z.string().optional(),
  maturity_date: z.string().optional(),
  notes: z.string().optional(),
});

export async function getInvestments() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInvestment(input: z.infer<typeof investmentSchema>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const parsed = investmentSchema.parse(input);

  const { data, error } = await supabase
    .from('investments')
    .insert({ ...parsed, company_id: user.company_id!, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/investments');
  revalidatePath('/wealth');
  return { data };
}

export async function updateInvestment(id: string, input: Partial<z.infer<typeof investmentSchema>>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('investments').update(input).eq('id', id).eq('company_id', user.company_id!);
  if (error) return { error: error.message };
  revalidatePath('/investments');
  revalidatePath('/wealth');
  return { success: true };
}

export async function getPortfolioSummary() {
  const investments = await getInvestments();
  const totalCapital = investments.reduce((s, i) => s + Number(i.capital), 0);
  const totalValue = investments.reduce((s, i) => s + Number(i.current_value), 0);
  const totalROI = totalCapital > 0 ? ((totalValue - totalCapital) / totalCapital) * 100 : 0;
  const monthlyIncome = investments.reduce((s, i) => s + Number(i.monthly_return), 0);
  const annualIncome = investments.reduce((s, i) => s + Number(i.annual_return), 0);

  const allocation = investments.map((i) => ({
    name: i.name,
    value: Number(i.current_value),
    type: i.type,
  }));

  return { totalCapital, totalValue, totalROI, monthlyIncome, annualIncome, allocation, count: investments.length };
}
