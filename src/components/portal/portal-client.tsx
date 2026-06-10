'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { createInvoice } from '@/lib/actions/invoices';
import { createSettlementRequest } from '@/lib/actions/approvals';
import { FileUpload } from '@/components/files/file-upload';
import { formatCurrency, getStatusColor } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { SessionUser } from '@/lib/auth/session';

export function PortalClient({
  user, profile, invoices, settlements,
}: {
  user: SessionUser;
  profile: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  settlements: Record<string, unknown>[];
}) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const balance = profile?.employee_balances;
  const bal = Array.isArray(balance) ? balance[0] : balance;

  async function submitInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const beforeVat = Number(fd.get('amount_before_vat'));
    const vat = beforeVat * 0.15;
    const r = await createInvoice({
      invoice_number: fd.get('invoice_number') as string,
      invoice_date: fd.get('invoice_date') as string,
      vendor_name: fd.get('vendor_name') as string,
      description: fd.get('description') as string,
      amount_before_vat: beforeVat,
      vat_amount: vat,
      amount_after_vat: beforeVat + vat,
      payment_method: 'custody',
    });
    if (r.error) toast.error(r.error);
    else { toast.success('Invoice submitted'); setInvoiceId(r.data!.id as string); }
  }

  async function submitSettlement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await createSettlementRequest({ amount: Number(fd.get('amount')), description: fd.get('description') as string });
    if (r.error) toast.error(r.error);
    else { toast.success('Settlement request submitted'); setShowSettlement(false); }
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold">Welcome, {user.full_name}</h2>
        <p className="text-sm text-muted-foreground">Your custody self-service portal</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Outstanding Balance</p><p className="text-2xl font-bold">{formatCurrency(Number(bal?.outstanding_balance ?? 0))}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Total Transferred</p><p className="text-2xl font-bold">{formatCurrency(Number(bal?.total_transferred ?? 0))}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Settlement Rate</p><p className="text-2xl font-bold">{Number(bal?.settlement_percentage ?? 0).toFixed(0)}%</p><Progress value={Number(bal?.settlement_percentage ?? 0)} className="mt-2 h-1.5" /></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setShowInvoice(true)}>Upload Invoice</Button>
        <Button variant="outline" onClick={() => setShowSettlement(true)}>Request Settlement</Button>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">My Invoices</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet</p> : invoices.map((inv) => (
            <div key={inv.id as string} className="flex justify-between rounded-lg border p-3">
              <div><p className="font-medium">{inv.vendor_name as string}</p><p className="text-xs text-muted-foreground">{inv.invoice_number as string}</p></div>
              <div className="flex items-center gap-2"><span className="font-semibold">{formatCurrency(Number(inv.amount_after_vat))}</span><Badge className={getStatusColor(inv.status as string)}>{inv.status as string}</Badge></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent><DialogHeader><DialogTitle>Submit Invoice</DialogTitle></DialogHeader>
          <form onSubmit={submitInvoice} className="space-y-4">
            <div className="space-y-2"><Label>Invoice #</Label><Input name="invoice_number" required /></div>
            <div className="space-y-2"><Label>Date</Label><Input name="invoice_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} /></div>
            <div className="space-y-2"><Label>Vendor</Label><Input name="vendor_name" required /></div>
            <div className="space-y-2"><Label>Amount (before VAT)</Label><Input name="amount_before_vat" type="number" step="0.01" required /></div>
            <div className="space-y-2"><Label>Description</Label><Input name="description" /></div>
            <Button type="submit" className="w-full">Submit</Button>
          </form>
          {invoiceId && <FileUpload bucket="invoices" entityType="invoice" entityId={invoiceId} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
        <DialogContent><DialogHeader><DialogTitle>Settlement Request</DialogTitle></DialogHeader>
          <form onSubmit={submitSettlement} className="space-y-4">
            <div className="space-y-2"><Label>Amount</Label><Input name="amount" type="number" step="0.01" required /></div>
            <div className="space-y-2"><Label>Description</Label><Input name="description" required /></div>
            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
