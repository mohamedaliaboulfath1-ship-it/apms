import { getWealthMetrics } from '@/lib/actions/forecast';
import { WealthClient } from '@/components/modules/wealth-client';

export default async function WealthPage() {
  const metrics = await getWealthMetrics();
  return <WealthClient metrics={metrics} />;
}
