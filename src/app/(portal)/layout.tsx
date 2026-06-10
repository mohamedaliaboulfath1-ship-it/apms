import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser().catch(() => null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div><h1 className="font-bold">Employee Portal</h1><p className="text-xs text-muted-foreground">{user?.full_name}</p></div>
        <div className="flex gap-2">
          {user && ['super_admin', 'finance_manager', 'accountant'].includes(user.role) && (
            <Link href="/"><Button variant="outline" size="sm">Admin Dashboard</Button></Link>
          )}
          <Link href="/portal"><Button variant="ghost" size="sm">Home</Button></Link>
          <Link href="/portal/invoices"><Button variant="ghost" size="sm">My Invoices</Button></Link>
          <Link href="/portal/settlements"><Button variant="ghost" size="sm">Settlements</Button></Link>
        </div>
      </header>
      {children}
    </div>
  );
}
