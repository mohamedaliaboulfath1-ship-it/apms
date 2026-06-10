'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getNotifications(unreadOnly = false) {
  const user = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const user = await requireSession();
  const supabase = await createClient();
  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
  revalidatePath('/notifications');
}

export async function markAllNotificationsRead() {
  const user = await requireSession();
  const supabase = await createClient();
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  revalidatePath('/notifications');
}

export async function getUnreadCount() {
  const user = await requireSession();
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

export async function createNotification(input: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const user = await requireSession();
  const supabase = await createClient();
  await supabase.from('notifications').insert({
    company_id: user.company_id!,
    channel: 'in_app',
    ...input,
  });
}

export async function generateMonthEndAlerts() {
  const user = await requireSession();
  const supabase = await createClient();
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  if (daysLeft <= 5) {
    await createNotification({
      user_id: user.id,
      type: 'month_end',
      title: 'Month-End Closing Approaching',
      message: `${daysLeft} days left to complete reconciliation for ${now.toLocaleString('en', { month: 'long' })}`,
      link: '/reconciliation',
    });
  }

  const { data: overdue } = await supabase
    .from('missing_documents')
    .select('*, employees(name)')
    .eq('company_id', user.company_id!)
    .eq('status', 'overdue');

  for (const doc of overdue ?? []) {
    await createNotification({
      user_id: user.id,
      type: 'missing_invoice',
      title: 'Overdue Missing Document',
      message: `${(doc.employees as { name: string })?.name}: ${doc.description}`,
      link: '/missing-invoices',
    });
  }
}
