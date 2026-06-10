'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Wallet, FileText, FileWarning, CreditCard,
  RefreshCw, TrendingUp, Scale, BarChart3, Bell, Bot, Settings,
  ChevronLeft, ChevronRight, Building2, PieChart, CheckSquare, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { UserRole } from '@/lib/auth/roles';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users, roles: ['super_admin', 'finance_manager', 'accountant', 'auditor'] },
  { href: '/custody', label: 'Custody', icon: Wallet, roles: ['super_admin', 'finance_manager', 'accountant'] },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/missing-invoices', label: 'Missing Docs', icon: FileWarning },
  { href: '/card-expenses', label: 'Card Expenses', icon: CreditCard },
  { href: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { href: '/investments', label: 'Investments', icon: PieChart },
  { href: '/wealth', label: 'Wealth Monitor', icon: TrendingUp },
  { href: '/reconciliation', label: 'Reconciliation', icon: Scale },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['super_admin', 'finance_manager', 'accountant'] },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'finance_manager'] },
];

export function AppSidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter((item) => !item.roles || item.roles.includes(userRole));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-border/50 bg-sidebar"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border/50 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <p className="text-sm font-semibold tracking-tight">APMS</p>
            <p className="text-[11px] text-muted-foreground">CashFlow Custody</p>
          </motion.div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filtered.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                  )}
                  <Icon className="relative h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border/50 p-3">
        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span className="ml-2">Collapse</span></>}
        </Button>
      </div>
    </motion.aside>
  );
}
