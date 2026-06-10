'use client';

import Link from 'next/link';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles';
import { signOut } from '@/lib/actions/auth';
import type { SessionUser } from '@/lib/auth/session';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/lib/actions/notifications';

export function AppHeader({ user }: { user: SessionUser }) {
  const { theme, setTheme } = useTheme();
  const { data: unreadCount } = useQuery({ queryKey: ['unread-notifications'], queryFn: () => getUnreadCount(), refetchInterval: 30000 });
  const initials = user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search... (⌘K)" className="h-9 border-border/50 bg-muted/30 pl-9 text-sm" readOnly onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden font-normal sm:flex">{ROLE_LABELS[user.role as UserRole]}</Badge>
        <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{unreadCount}</span>
          )}
        </Link>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-9 items-center gap-2 rounded-md px-2 hover:bg-accent">
            <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-xs text-primary">{initials}</AvatarFallback></Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user.full_name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.full_name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem><Link href="/portal">Employee Portal</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
