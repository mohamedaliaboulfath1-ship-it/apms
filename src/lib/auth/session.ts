import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/auth/roles';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  avatar_url: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role, company_id, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return profile as SessionUser;
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (!['super_admin', 'finance_manager', 'accountant'].includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function getEmployeeId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id ?? null;
}
