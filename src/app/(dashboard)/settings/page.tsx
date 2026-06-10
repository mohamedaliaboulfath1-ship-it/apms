import { getCustodyAccount } from '@/lib/actions/custody';
import { getSessionUser } from '@/lib/auth/session';
import { SettingsClient } from '@/components/modules/settings-client';

export default async function SettingsPage() {
  const user = await getSessionUser();
  const account = await getCustodyAccount();
  return <SettingsClient user={user!} account={account} />;
}
