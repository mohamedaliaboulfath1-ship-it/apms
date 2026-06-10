'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

const reports = [
  { type: 'employee-statement', name: 'Employee Statement' },
  { type: 'custody-statement', name: 'Custody Statement' },
  { type: 'monthly-settlement', name: 'Monthly Settlement' },
  { type: 'outstanding-advances', name: 'Outstanding Advances' },
  { type: 'missing-documents', name: 'Missing Documents' },
  { type: 'subscription-report', name: 'Subscription Report' },
  { type: 'investment-report', name: 'Investment Report' },
  { type: 'executive-summary', name: 'Executive Summary' },
];

async function downloadReport(type: string, format: string) {
  try {
    const res = await fetch(`/api/reports?type=${type}&format=${format}`);
    if (!res.ok) throw new Error('Failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.${format === 'excel' ? 'xlsx' : format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  } catch {
    toast.error('Report generation failed — ensure Supabase is connected');
  }
}

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Reports Center</h1>
        <p className="text-sm text-muted-foreground">Export live data as Excel, PDF, or CSV</p>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r, i) => (
          <motion.div key={r.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{r.name}</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => downloadReport(r.type, 'excel')}><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => downloadReport(r.type, 'pdf')}><FileText className="h-3.5 w-3.5" /> PDF</Button>
                <Button size="sm" variant="ghost" onClick={() => downloadReport(r.type, 'csv')}><Download className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
