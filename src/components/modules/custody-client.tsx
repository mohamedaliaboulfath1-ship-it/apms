'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCustodyTransactions, createCustodyTransaction, getCustodyAccount } from '@/lib/actions/custody';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

const typeLabels: Record<string, string> = {
  main_receive: 'Main Receive', employee_transfer: 'Employee Transfer',
  employee_return: 'Employee Return', direct_purchase: 'Direct Purchase',
  settlement: 'Settlement', adjustment: 'Adjustment',
};

export function CustodyClient({
  initialData, account, employees,
}: {
  initialData: Awaited<ReturnType<typeof getCustodyTransactions>>;
  account: Awaited<ReturnType<typeof getCustodyAccount>>;
  employees: { id: string; name: string }[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data: transactions } = useQuery({
    queryKey: ['custody-transactions'],
    queryFn: () => getCustodyTransactions(),
    initialData,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createCustodyTransaction({
      custody_account_id: account.id,
      type: fd.get('type') as 'employee_transfer',
      amount: Number(fd.get('amount')),
      employee_id: fd.get('employee_id') as string || undefined,
      transfer_method: fd.get('transfer_method') as 'bank_transfer',
      reference_number: fd.get('reference_number') as string || undefined,
      reason: fd.get('reason') as string || undefined,
      transaction_date: fd.get('transaction_date') as string || new Date().toISOString().split('T')[0],
    });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else { toast.success('Transaction created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['custody-transactions'] }); }
  }

  return (
    <>
      {account && (
        <div className="px-6 pt-6">
          <Card className="border-border/50">
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-xs text-muted-foreground">Current Balance</p><p className="text-2xl font-bold">{formatCurrency(Number(account.current_balance))}</p></div>
              <div><p className="text-xs text-muted-foreground">Monthly Limit</p><p className="text-lg font-semibold">{formatCurrency(Number(account.monthly_limit))}</p></div>
            </CardContent>
          </Card>
        </div>
      )}
      <DataTable
        title="Custody Management"
        description="Live custody transactions from Supabase"
        data={transactions.map((t) => ({ ...t, id: t.id, employee_name: (t.employees as { name: string } | null)?.name }))}
        searchPlaceholder="Search transactions..."
        addLabel="New Transfer"
        onAdd={() => setShowForm(true)}
        columns={[
          { key: 'transaction_date', header: 'Date', render: (tx) => formatDate(tx.transaction_date) },
          { key: 'type', header: 'Type', render: (tx) => <Badge variant="outline">{typeLabels[tx.type] ?? tx.type}</Badge> },
          { key: 'employee_name', header: 'Employee', render: (tx) => tx.employee_name ?? '—' },
          { key: 'amount', header: 'Amount', render: (tx) => <span className="font-semibold">{formatCurrency(Number(tx.amount))}</span> },
          { key: 'transfer_method', header: 'Method', render: (tx) => tx.transfer_method?.replace('_', ' ') ?? '—' },
          { key: 'reason', header: 'Reason' },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Custody Transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Type</Label>
              <Select name="type" defaultValue="employee_transfer"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount (SAR)</Label><Input name="amount" type="number" step="0.01" required /></div>
            <div className="space-y-2"><Label>Employee</Label>
              <Select name="employee_id"><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Method</Label>
              <Select name="transfer_method" defaultValue="bank_transfer"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input name="reason" /></div>
            <div className="space-y-2"><Label>Date</Label><Input name="transaction_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} /></div>
            <Button type="submit" disabled={loading} className="w-full">Create Transaction</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
