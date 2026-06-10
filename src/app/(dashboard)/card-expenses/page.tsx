import { getCardTransactions } from '@/lib/actions/card-expenses';
import { CardExpensesClient } from '@/components/modules/card-expenses-client';

export default async function CardExpensesPage() {
  const data = await getCardTransactions();
  return <CardExpensesClient initialData={data} />;
}
