'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { saveReconciliation, updateClosingWizardStep, finalizeMonthEnd } from '@/lib/actions/reconciliation';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

const statusConfig = {
  green: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Reconciled' },
  yellow: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Minor Discrepancy' },
  red: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Action Required' },
  pending: { icon: AlertTriangle, color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'Pending' },
};

export function ReconciliationClient({
  data, closing, month, year,
}: {
  data: Record<string, unknown>;
  closing: Record<string, unknown> | null;
  month: number;
  year: number;
}) {
  const [step, setStep] = useState(Number(closing?.wizard_step ?? 1));
  const [bankBalance, setBankBalance] = useState('');
  const config = statusConfig[(data.status as keyof typeof statusConfig) ?? 'pending'];
  const StatusIcon = config.icon;

  const rows = [
    { label: 'Opening Balance', value: Number(data.opening_balance) },
    { label: 'Received Custody', value: Number(data.received_custody), positive: true },
    { label: 'Total Distributed', value: -Number(data.total_distributed) },
    { label: 'Total Settled', value: Number(data.total_settled), positive: true },
    { label: 'Direct Purchases', value: -Number(data.direct_purchases) },
    { label: 'Card Purchases', value: -Number(data.card_purchases) },
    { label: 'Closing Balance', value: Number(data.closing_balance), bold: true },
  ];

  async function saveBank() {
    const r = await saveReconciliation({ period_month: month, period_year: year, actual_bank_balance: Number(bankBalance) });
    if (r.error) toast.error(r.error);
    else toast.success('Reconciliation saved');
  }

  async function nextStep() {
    await updateClosingWizardStep(month, year, step + 1);
    setStep(step + 1);
  }

  async function closeMonth() {
    await finalizeMonthEnd(month, year);
    toast.success('Month-end closed');
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Reconciliation Center</h1>
        <p className="text-sm text-muted-foreground">{new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })} · Wizard Step {step}/5</p>
      </motion.div>

      <div className={`flex items-center gap-3 rounded-xl p-4 ${config.bg}`}>
        <StatusIcon className={`h-6 w-6 ${config.color}`} />
        <div><p className={`font-semibold ${config.color}`}>{config.label}</p><p className="text-sm text-muted-foreground">Supporting docs: {Number(data.supporting_docs_pct).toFixed(1)}%</p></div>
      </div>

      <Progress value={(step / 5) * 100} className="h-2" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm">Statement</CardTitle></CardHeader>
          <CardContent className="space-y-3">{rows.map((row) => (
            <div key={row.label} className={`flex justify-between py-2 ${row.bold ? 'border-t font-bold' : ''}`}>
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm ${row.positive ? 'text-emerald-600' : row.value < 0 ? 'text-red-600' : ''}`}>{row.value < 0 ? '-' : ''}{formatCurrency(Math.abs(row.value))}</span>
            </div>
          ))}</CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Bank Reconciliation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Actual Bank Balance</Label><Input type="number" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} placeholder={String(data.closing_balance)} /></div>
            <Button onClick={saveBank} className="w-full">Save & Compare</Button>
            <div className="space-y-2"><div className="flex justify-between text-sm"><span>Missing Docs</span><span className="font-semibold text-amber-600">{Number(data.missing_docs_pct).toFixed(1)}%</span></div><Progress value={Number(data.supporting_docs_pct)} className="h-2" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {step < 5 && <Button onClick={nextStep}>Next Step →</Button>}
        {step >= 5 && <Button onClick={closeMonth} variant="default">Finalize Month-End Closing</Button>}
      </div>
    </div>
  );
}
