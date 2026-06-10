'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/format';
import type { SessionUser } from '@/lib/auth/session';

export function SettingsClient({
  user, account,
}: {
  user: SessionUser;
  account: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="custody">Custody</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <Card><CardHeader><CardTitle className="text-sm">Your Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input defaultValue={user.full_name} /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
              <div className="space-y-2"><Label>Role</Label><Input defaultValue={user.role} disabled /></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custody" className="mt-4">
          <Card><CardHeader><CardTitle className="text-sm">Custody Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Account Name</Label><Input defaultValue={account?.name as string} /></div>
              <div className="space-y-2"><Label>Holder</Label><Input defaultValue={account?.holder_name as string} /></div>
              <div className="space-y-2"><Label>Current Balance</Label><Input value={formatCurrency(Number(account?.current_balance ?? 0))} disabled /></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card><CardContent className="space-y-4 pt-6">
            {['Balance overdue alerts', 'Missing invoice reminders', 'Subscription renewals', 'Month-end closing'].map((item) => (
              <div key={item}><div className="flex justify-between"><span className="text-sm">{item}</span><Switch defaultChecked /></div><Separator className="mt-4" /></div>
            ))}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="flex justify-between"><span className="text-sm">Audit Logging</span><Switch defaultChecked disabled /></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm">Row Level Security</span><Switch defaultChecked disabled /></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
