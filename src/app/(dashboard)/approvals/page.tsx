import { getPendingApprovals, getAuditLogs } from '@/lib/actions/approvals';
import { ApprovalsClient } from '@/components/modules/approvals-client';

export default async function ApprovalsPage() {
  const [approvals, auditLogs] = await Promise.all([getPendingApprovals(), getAuditLogs(30)]);
  return <ApprovalsClient initialApprovals={approvals} auditLogs={auditLogs} />;
}
