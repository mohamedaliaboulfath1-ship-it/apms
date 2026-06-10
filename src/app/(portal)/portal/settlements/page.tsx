import { PortalClient } from '@/components/portal/portal-client';
import { getSessionUser } from '@/lib/auth/session';
import { getMyEmployeeProfile } from '@/lib/actions/employees';
import { getInvoices } from '@/lib/actions/invoices';
import { getSettlementRequests } from '@/lib/actions/approvals';
import { redirect } from 'next/navigation';

export default async function PortalSettlementsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const [profile, invoices, settlements] = await Promise.all([getMyEmployeeProfile(), getInvoices(), getSettlementRequests()]);
  return <PortalClient user={user} profile={profile} invoices={invoices} settlements={settlements} />;
}
