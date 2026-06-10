import { getInvestments, getPortfolioSummary } from '@/lib/actions/investments';
import { InvestmentsClient } from '@/components/modules/investments-client';

export default async function InvestmentsPage() {
  const [investments, portfolio] = await Promise.all([getInvestments(), getPortfolioSummary()]);
  return <InvestmentsClient initialData={investments} portfolio={portfolio} />;
}
