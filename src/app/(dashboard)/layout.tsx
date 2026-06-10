import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { CommandPalette } from '@/components/search/command-palette';
import { getSessionUser } from '@/lib/auth/session';
import { hasSupabaseConfig } from '@/lib/env';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) redirect('/setup');
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect('/login');

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <CommandPalette />
        <AppSidebar userRole={user.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader user={user} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
