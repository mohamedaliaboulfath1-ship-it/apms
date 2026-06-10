'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireSession, getEmployeeId } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const employeeSchema = z.object({
  name: z.string().min(2),
  name_ar: z.string().optional(),
  department: z.string().min(1),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export async function getEmployees() {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      employee_balances (*)
    `)
    .eq('company_id', user.company_id!)
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEmployee(id: string) {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      employee_balances (*),
      custody_transactions (*),
      invoices (*)
    `)
    .eq('id', id)
    .eq('company_id', user.company_id!)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createEmployee(formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const parsed = employeeSchema.parse({
    name: formData.get('name'),
    name_ar: formData.get('name_ar') || undefined,
    department: formData.get('department'),
    position: formData.get('position') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    status: formData.get('status') || 'active',
  });

  const { data, error } = await supabase
    .from('employees')
    .insert({ ...parsed, company_id: user.company_id! })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('activity_logs').insert({
    company_id: user.company_id,
    user_id: user.id,
    activity_type: 'employee_created',
    description: `Created employee: ${parsed.name}`,
    metadata: { employee_id: data.id },
  });

  revalidatePath('/employees');
  return { data };
}

export async function updateEmployee(id: string, formData: FormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const parsed = employeeSchema.partial().parse({
    name: formData.get('name') || undefined,
    department: formData.get('department') || undefined,
    position: formData.get('position') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    status: formData.get('status') || undefined,
  });

  const { error } = await supabase
    .from('employees')
    .update(parsed)
    .eq('id', id)
    .eq('company_id', user.company_id!);

  if (error) return { error: error.message };
  revalidatePath('/employees');
  return { success: true };
}

export async function getMyEmployeeProfile() {
  const user = await requireSession();
  const supabase = await createClient();
  const employeeId = await getEmployeeId(user.id);
  if (!employeeId) return null;

  const { data } = await supabase
    .from('employees')
    .select(`*, employee_balances (*)`)
    .eq('id', employeeId)
    .single();

  return data;
}
