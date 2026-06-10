'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import {
  LayoutDashboard, Users, Wallet, FileText, FileWarning, CreditCard,
  RefreshCw, TrendingUp, Scale, BarChart3, Bell, Bot, Settings,
  PieChart, CheckSquare, FolderOpen, LogOut,
} from 'lucide-react';
import { signOut } from '@/lib/actions/auth';

const pages = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Main' },
  { href: '/employees', label: 'Employees', icon: Users, group: 'Main' },
  { href: '/custody', label: 'Custody', icon: Wallet, group: 'Finance' },
  { href: '/invoices', label: 'Invoices', icon: FileText, group: 'Finance' },
  { href: '/missing-invoices', label: 'Missing Documents', icon: FileWarning, group: 'Finance' },
  { href: '/card-expenses', label: 'Card Expenses', icon: CreditCard, group: 'Finance' },
  { href: '/subscriptions', label: 'Subscriptions', icon: RefreshCw, group: 'Finance' },
  { href: '/investments', label: 'Investments', icon: PieChart, group: 'Finance' },
  { href: '/wealth', label: 'Wealth Monitor', icon: TrendingUp, group: 'Finance' },
  { href: '/reconciliation', label: 'Reconciliation', icon: Scale, group: 'Finance' },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare, group: 'Workflow' },
  { href: '/documents', label: 'Documents', icon: FolderOpen, group: 'Workflow' },
  { href: '/reports', label: 'Reports', icon: BarChart3, group: 'Workflow' },
  { href: '/notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { href: '/assistant', label: 'AI Assistant', icon: Bot, group: 'System' },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'System' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const groups = [...new Set(pages.map((p) => p.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {pages.filter((p) => p.group === group).map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem key={page.href} onSelect={() => { router.push(page.href); setOpen(false); }}>
                  <Icon className="mr-2 h-4 w-4" />
                  {page.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
