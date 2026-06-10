'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, StatusBadge } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSubscriptions, createSubscription } from '@/lib/actions/subscriptions';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export function SubscriptionsClient({
  initialData, upcoming,
}: {
  initialData: Awaited<ReturnType<typeof getSubscriptions>>;
  upcoming: Awaited<ReturnType<typeof import('@/lib/actions/subscriptions').getUpcomingRenewals>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['subscriptions'], queryFn: () => getSubscriptions(), initialData });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await createSubscription({
      vendor_name: fd.get('vendor_name') as string,
      name: fd.get('name') as string,
      billing_cycle: fd.get('billing_cycle') as 'monthly',
      monthly_cost: Number(fd.get('monthly_cost') || 0),
      annual_cost: Number(fd.get('annual_cost') || 0),
      renewal_date: fd.get('renewal_date') as string,
      auto_renewal: true,
      payment_method: 'card',
      alert_days_before: 7,
    });
    if (r.error) toast.error(r.error);
    else { toast.success('Created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['subscriptions'] }); }
  }

  return (
    <>
      {upcoming.length > 0 && (
        <div className="grid gap-3 px-6 pt-6 sm:grid-cols-3">
          {upcoming.slice(0, 3).map((s) => (
            <Card key={s.id} className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <p className="text-xs text-amber-600">Renewal {formatDate(s.renewal_date)}</p>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(Number(s.monthly_cost ?? s.annual_cost ?? 0))}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DataTable title="Subscriptions" description="Live subscription management" data={data ?? []} addLabel="Add Subscription" onAdd={() => setShowForm(true)}
        columns={[
          { key: 'name', header: 'Name' }, { key: 'vendor_name', header: 'Vendor' },
          { key: 'billing_cycle', header: 'Billing', render: (s) => <Badge variant="outline">{s.billing_cycle}</Badge> },
          { key: 'cost', header: 'Cost', render: (s) => formatCurrency(Number(s.monthly_cost ?? s.annual_cost ?? 0)) },
          { key: 'renewal_date', header: 'Renewal', render: (s) => formatDate(s.renewal_date) },
          { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Subscription</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Service Name</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Vendor</Label><Input name="vendor_name" required /></div>
            <div className="space-y-2"><Label>Billing</Label><Select name="billing_cycle" defaultValue="monthly"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Monthly Cost</Label><Input name="monthly_cost" type="number" step="0.01" /></div>
            <div className="space-y-2"><Label>Annual Cost</Label><Input name="annual_cost" type="number" step="0.01" /></div>
            <div className="space-y-2"><Label>Renewal Date</Label><Input name="renewal_date" type="date" required /></div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
