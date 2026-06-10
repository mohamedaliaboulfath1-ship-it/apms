'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Sparkles } from 'lucide-react';
import { getDashboardKPIs } from '@/lib/actions/dashboard';
import { detectMissingInvoices } from '@/lib/actions/missing-documents';
import { getUpcomingRenewals } from '@/lib/actions/subscriptions';

const suggestions = [
  'Who owes money?',
  'What invoices are missing?',
  'What subscriptions renew soon?',
  'Give me a financial summary',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I\'m your APMS Financial Assistant connected to live Supabase data. Ask me anything about balances, invoices, or forecasts.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function getLiveAnswer(query: string): Promise<string> {
    const q = query.toLowerCase();
    if (q.includes('owes') || q.includes('outstanding')) {
      const kpis = await getDashboardKPIs();
      return `**${kpis.unsettledEmployees} employees** have outstanding balances totaling **${kpis.outstandingBalance.toFixed(2)} SAR**. Settlement rate: ${kpis.monthlySettlementRate.toFixed(1)}%.`;
    }
    if (q.includes('missing')) {
      const alerts = await detectMissingInvoices();
      if (alerts.length === 0) return 'No significant missing invoice gaps detected.';
      return alerts.map((a) => `• ${(a.employee as { name: string })?.name}: ${a.gap.toFixed(2)} SAR gap`).join('\n');
    }
    if (q.includes('subscription') || q.includes('renew')) {
      const subs = await getUpcomingRenewals(30);
      if (subs.length === 0) return 'No subscriptions renewing in the next 30 days.';
      return subs.map((s) => `• ${s.name} — renews ${s.renewal_date} (${s.monthly_cost ?? s.annual_cost} SAR)`).join('\n');
    }
    const kpis = await getDashboardKPIs();
    return `**Financial Summary:**\n• Custody: ${kpis.currentCustodyBalance.toFixed(2)} SAR\n• Outstanding: ${kpis.outstandingBalance.toFixed(2)} SAR\n• Monthly spending: ${kpis.monthlySpending.toFixed(2)} SAR\n• Settlement rate: ${kpis.monthlySettlementRate.toFixed(1)}%\n• Investments: ${kpis.investmentValue.toFixed(2)} SAR`;
  }

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((p) => [...p, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const answer = await getLiveAnswer(text);
      setMessages((p) => [...p, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Unable to fetch live data. Ensure Supabase is connected.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5"><Bot className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold">AI Financial Assistant</h1><p className="text-sm text-muted-foreground">Powered by live Supabase data</p></div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => sendMessage(s)}><Sparkles className="mr-1.5 h-3 w-3" />{s}</Button>
        ))}
      </div>
      <Card className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{msg.content}</div>
              </motion.div>
            ))}
            {loading && <div className="text-sm text-muted-foreground">Analyzing live data...</div>}
          </div>
        </ScrollArea>
        <CardContent className="border-t p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your finances..." className="flex-1" />
            <Button type="submit" disabled={loading}><Send className="h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
