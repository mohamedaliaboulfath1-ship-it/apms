import { getReconciliation, getMonthEndClosing } from '@/lib/actions/reconciliation';
import { ReconciliationClient } from '@/components/modules/reconciliation-client';

export default async function ReconciliationPage() {
  const now = new Date();
  const [reconciliation, closing] = await Promise.all([
    getReconciliation(now.getMonth() + 1, now.getFullYear()),
    getMonthEndClosing(now.getMonth() + 1, now.getFullYear()),
  ]);
  return <ReconciliationClient data={reconciliation} closing={closing} month={now.getMonth() + 1} year={now.getFullYear()} />;
}
