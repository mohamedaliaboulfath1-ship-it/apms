'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, StatusBadge } from '@/components/shared/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getInvoices, createInvoice, updateInvoiceStatus } from '@/lib/actions/invoices';
import { FileUpload } from '@/components/files/file-upload';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export function InvoicesClient({ initialData }: { initialData: Awaited<ReturnType<typeof getInvoices>> }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices(), initialData });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const beforeVat = Number(fd.get('amount_before_vat'));
    const vat = Number(fd.get('vat_amount') || beforeVat * 0.15);
    const result = await createInvoice({
      invoice_number: fd.get('invoice_number') as string,
      invoice_date: fd.get('invoice_date') as string,
      vendor_name: fd.get('vendor_name') as string,
      description: fd.get('description') as string,
      amount_before_vat: beforeVat,
      vat_amount: vat,
      amount_after_vat: beforeVat + vat,
      department: fd.get('department') as string,
      payment_method: 'custody',
    });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else { toast.success('Invoice created'); setSelectedId(result.data!.id); qc.invalidateQueries({ queryKey: ['invoices'] }); }
  }

  async function handleStatus(id: string, status: 'approved' | 'rejected' | 'settled') {
    const result = await updateInvoiceStatus(id, status);
    if (result.error) toast.error(result.error);
    else { toast.success(`Invoice ${status}`); qc.invalidateQueries({ queryKey: ['invoices'] }); }
  }

  return (
    <>
      <DataTable
        title="Invoice Management"
        description="Live invoices with approval workflow"
        data={invoices.map((i) => ({ ...i, id: i.id, employee_name: (i.employees as { name: string } | null)?.name }))}
        searchPlaceholder="Search invoices..."
        addLabel="New Invoice"
        onAdd={() => setShowForm(true)}
        columns={[
          { key: 'invoice_number', header: 'Invoice #' },
          { key: 'invoice_date', header: 'Date', render: (inv) => formatDate(inv.invoice_date) },
          { key: 'vendor_name', header: 'Vendor' },
          { key: 'amount_after_vat', header: 'Amount', render: (inv) => <span className="font-semibold">{formatCurrency(Number(inv.amount_after_vat))}</span> },
          { key: 'employee_name', header: 'Employee' },
          { key: 'status', header: 'Status', render: (inv) => <StatusBadge status={inv.status} /> },
          { key: 'actions', header: 'Actions', render: (inv) => inv.status === 'pending' ? (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => handleStatus(inv.id, 'approved')}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => handleStatus(inv.id, 'rejected')}>Reject</Button>
            </div>
          ) : null },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice #</Label><Input name="invoice_number" required /></div>
              <div className="space-y-2"><Label>Date</Label><Input name="invoice_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
            </div>
            <div className="space-y-2"><Label>Vendor</Label><Input name="vendor_name" required /></div>
            <div className="space-y-2"><Label>Description</Label><Input name="description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount (before VAT)</Label><Input name="amount_before_vat" type="number" step="0.01" required /></div>
              <div className="space-y-2"><Label>VAT</Label><Input name="vat_amount" type="number" step="0.01" placeholder="Auto 15%" /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">Create Invoice</Button>
          </form>
          {selectedId && (
            <div className="mt-4 border-t pt-4">
              <Label>Upload Attachments</Label>
              <FileUpload bucket="invoices" entityType="invoice" entityId={selectedId} onSuccess={() => qc.invalidateQueries({ queryKey: ['invoices'] })} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
