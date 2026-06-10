import { getNotifications } from '@/lib/actions/notifications';
import { NotificationsClient } from '@/components/modules/notifications-client';

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  return <NotificationsClient initialData={notifications} />;
}
