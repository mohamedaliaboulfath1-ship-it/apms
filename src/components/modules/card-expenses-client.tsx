'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getCardTransactions, createCardTransaction } from '@/lib/actions/card-expenses';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export function CardExpensesClient({ initialData }: { initialData: Awaited<ReturnType<typeof getCardTransactions>> }) {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['card-expenses'], queryFn: () => getCardTransactions(), initialData });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await createCardTransaction({
      card_name: 'Corporate Card',
      transaction_date: fd.get('transaction_date') as string,
      vendor_name: fd.get('vendor_name') as string,
      description: fd.get('description') as string,
      amount: Number(fd.get('amount')),
      is_subscription: fd.get('is_subscription') === 'on',
    });
    if (r.error) toast.error(r.error);
    else { toast.success('Created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['card-expenses'] }); }
  }

  return (
    <>
      <DataTable title="Card Expenses" description="Live corporate card transactions" data={data ?? []} addLabel="Add Transaction" onAdd={() => setShowForm(true)}
        columns={[
          { key: 'transaction_date', header: 'Date', render: (t) => formatDate(t.transaction_date) },
          { key: 'vendor_name', header: 'Vendor' },
          { key: 'description', header: 'Description' },
          { key: 'amount', header: 'Amount', render: (t) => formatCurrency(Number(t.amount)) },
          { key: 'is_subscription', header: 'Type', render: (t) => <Badge variant={t.is_subscription ? 'default' : 'outline'}>{t.is_subscription ? 'Subscription' : 'One-time'}</Badge> },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Card Transaction</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Date</Label><Input name="transaction_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
            <div className="space-y-2"><Label>Vendor</Label><Input name="vendor_name" required /></div>
            <div className="space-y-2"><Label>Description</Label><Input name="description" /></div>
            <div className="space-y-2"><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_subscription" /> Subscription</label>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
