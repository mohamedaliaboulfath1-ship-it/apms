import { getSessionUser, getEmployeeId } from '@/lib/auth/session';
import { getMyEmployeeProfile } from '@/lib/actions/employees';
import { getInvoices } from '@/lib/actions/invoices';
import { getSettlementRequests } from '@/lib/actions/approvals';
import { redirect } from 'next/navigation';
import { hasSupabaseConfig } from '@/lib/env';
import { PortalClient } from '@/components/portal/portal-client';

export default async function PortalPage() {
  if (!hasSupabaseConfig()) redirect('/setup');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [profile, invoices, settlements] = await Promise.all([
    getMyEmployeeProfile(),
    getInvoices(),
    getSettlementRequests(),
  ]);

  return <PortalClient user={user} profile={profile} invoices={invoices} settlements={settlements} />;
}
