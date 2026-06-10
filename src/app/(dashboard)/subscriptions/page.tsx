import { getSubscriptions, getUpcomingRenewals } from '@/lib/actions/subscriptions';
import { SubscriptionsClient } from '@/components/modules/subscriptions-client';

export default async function SubscriptionsPage() {
  const [subscriptions, upcoming] = await Promise.all([getSubscriptions(), getUpcomingRenewals(30)]);
  return <SubscriptionsClient initialData={subscriptions} upcoming={upcoming} />;
}
