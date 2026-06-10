import { getCustodyTransactions, getCustodyAccount } from '@/lib/actions/custody';
import { getEmployees } from '@/lib/actions/employees';
import { CustodyClient } from '@/components/modules/custody-client';

export default async function CustodyPage() {
  const [transactions, account, employees] = await Promise.all([
    getCustodyTransactions(),
    getCustodyAccount(),
    getEmployees(),
  ]);
  return <CustodyClient initialData={transactions} account={account} employees={employees} />;
}
