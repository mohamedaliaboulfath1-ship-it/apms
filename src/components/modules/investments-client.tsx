'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, StatusBadge } from '@/components/shared/data-table';
import { ChartCard } from '@/components/charts/chart-card';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInvestments, createInvestment } from '@/lib/actions/investments';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export function InvestmentsClient({
  initialData, portfolio,
}: {
  initialData: Awaited<ReturnType<typeof getInvestments>>;
  portfolio: Awaited<ReturnType<typeof import('@/lib/actions/investments').getPortfolioSummary>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['investments'], queryFn: () => getInvestments(), initialData });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await createInvestment({
      name: fd.get('name') as string,
      type: fd.get('type') as 'fixed_deposit',
      capital: Number(fd.get('capital')),
      current_value: Number(fd.get('current_value')),
      monthly_return: Number(fd.get('monthly_return') || 0),
      annual_return: Number(fd.get('annual_return') || 0),
      risk_level: fd.get('risk_level') as 'medium',
    });
    if (r.error) toast.error(r.error);
    else { toast.success('Created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['investments'] }); }
  }

  return (
    <>
      <div className="grid gap-4 px-6 pt-6 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Capital</p><p className="text-xl font-bold">{formatCurrency(portfolio.totalCapital)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Current Value</p><p className="text-xl font-bold">{formatCurrency(portfolio.totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Portfolio ROI</p><p className="text-xl font-bold text-emerald-600">{portfolio.totalROI.toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Income</p><p className="text-xl font-bold">{formatCurrency(portfolio.monthlyIncome)}</p></CardContent></Card>
      </div>
      <div className="px-6 pt-4"><ChartCard title="Allocation" data={portfolio.allocation} type="pie" height={240} /></div>
      <DataTable title="Investment Tracking" description="Live portfolio from Supabase" data={data ?? []} addLabel="Add Investment" onAdd={() => setShowForm(true)}
        columns={[
          { key: 'name', header: 'Name' }, { key: 'type', header: 'Type' },
          { key: 'capital', header: 'Capital', render: (i) => formatCurrency(Number(i.capital)) },
          { key: 'current_value', header: 'Value', render: (i) => formatCurrency(Number(i.current_value)) },
          { key: 'roi', header: 'ROI', render: (i) => `${Number(i.roi).toFixed(2)}%` },
          { key: 'risk_level', header: 'Risk', render: (i) => <StatusBadge status={i.risk_level} /> },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Type</Label><Select name="type" defaultValue="fixed_deposit"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed_deposit">Fixed Deposit</SelectItem><SelectItem value="mutual_fund">Mutual Fund</SelectItem><SelectItem value="stocks">Stocks</SelectItem><SelectItem value="bonds">Bonds</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Capital</Label><Input name="capital" type="number" required /></div><div className="space-y-2"><Label>Current Value</Label><Input name="current_value" type="number" required /></div></div>
            <div className="space-y-2"><Label>Risk</Label><Select name="risk_level" defaultValue="medium"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
