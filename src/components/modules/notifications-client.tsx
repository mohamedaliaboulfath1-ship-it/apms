'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';
import { formatRelativeDate } from '@/lib/utils/format';

export function NotificationsClient({ initialData }: { initialData: Awaited<ReturnType<typeof getNotifications>> }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications(), initialData });
  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-muted-foreground">{unread} unread</p></div>
        <Button variant="outline" size="sm" className="gap-2" onClick={async () => { await markAllNotificationsRead(); qc.invalidateQueries({ queryKey: ['notifications'] }); }}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <Card key={n.id} className={!n.is_read ? 'border-primary/20 bg-primary/5' : ''} onClick={() => markNotificationRead(n.id)}>
            <CardContent className="flex items-start gap-4 p-4">
              <Bell className={`h-4 w-4 mt-1 ${!n.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1"><div className="flex items-center gap-2"><p className="font-medium">{n.title}</p>{!n.is_read && <Badge className="h-5 text-[10px]">New</Badge>}</div><p className="text-sm text-muted-foreground">{n.message}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(n.created_at)}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
