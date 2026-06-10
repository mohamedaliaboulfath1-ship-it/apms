'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const subSchema = z.object({
  vendor_name: z.string().min(1),
  name: z.string().min(1),
  category_id: z.string().uuid().optional(),
  billing_cycle: z.enum(['monthly', 'annual', 'quarterly']),
  monthly_cost: z.number().optional(),
  annual_cost: z.number().optional(),
  renewal_date: z.string(),
  owner_name: z.string().optional(),
  payment_method: z.enum(['custody', 'card', 'cash', 'bank_transfer']).default('card'),
  auto_renewal: z.boolean().default(true),
  alert_days_before: z.number().default(7),
  notes: z.string().optional(),
});

export async function getSubscriptions() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', user.company_id!)
    .order('renewal_date');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSubscription(input: z.infer<typeof subSchema>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const parsed = subSchema.parse(input);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ ...parsed, company_id: user.company_id! })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/subscriptions');
  return { data };
}

export async function updateSubscription(id: string, input: Partial<z.infer<typeof subSchema>>) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('subscriptions').update(input).eq('id', id).eq('company_id', user.company_id!);
  if (error) return { error: error.message };
  revalidatePath('/subscriptions');
  return { success: true };
}

export async function getUpcomingRenewals(days = 30) {
  const user = await requireSession();
  const supabase = await createClient();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', user.company_id!)
    .eq('status', 'active')
    .lte('renewal_date', future.toISOString().split('T')[0])
    .order('renewal_date');

  return data ?? [];
}

export async function getSubscriptionCosts() {
  const subs = await getSubscriptions();
  const active = subs.filter((s) => s.status === 'active');
  const monthly = active.reduce((s, sub) => {
    if (sub.billing_cycle === 'monthly') return s + Number(sub.monthly_cost ?? 0);
    if (sub.billing_cycle === 'annual') return s + Number(sub.annual_cost ?? 0) / 12;
    if (sub.billing_cycle === 'quarterly') return s + Number(sub.annual_cost ?? sub.monthly_cost ?? 0) / 3;
    return s;
  }, 0);
  const annual = active.reduce((s, sub) => {
    if (sub.billing_cycle === 'annual') return s + Number(sub.annual_cost ?? 0);
    if (sub.billing_cycle === 'monthly') return s + Number(sub.monthly_cost ?? 0) * 12;
    return s + Number(sub.annual_cost ?? sub.monthly_cost ?? 0) * 4;
  }, 0);
  return { monthly, annual, count: active.length };
}

export async function checkRenewalAlerts() {
  const user = await requireSession();
  const supabase = await createClient();
  const subs = await getUpcomingRenewals(14);

  for (const sub of subs) {
    const daysUntil = Math.ceil((new Date(sub.renewal_date).getTime() - Date.now()) / 86400000);
    if (daysUntil <= sub.alert_days_before) {
      await supabase.from('notifications').upsert({
        company_id: user.company_id!,
        user_id: user.id,
        type: 'subscription_renewal',
        channel: 'in_app',
        title: 'Subscription Renewal',
        message: `${sub.name} renews in ${daysUntil} days`,
        link: `/subscriptions`,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
  }
}
