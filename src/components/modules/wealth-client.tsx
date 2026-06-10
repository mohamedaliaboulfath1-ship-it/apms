'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartCard } from '@/components/charts/chart-card';
import { formatCurrency } from '@/lib/utils/format';

export function WealthClient({ metrics }: { metrics: Awaited<ReturnType<typeof import('@/lib/actions/forecast').getWealthMetrics>> }) {
  const forecastChart = metrics.forecasts.map((f) => ({
    name: `${f.horizon_days}d`,
    projected: f.projected_balance,
    expenses: f.expected_expenses,
    income: f.investment_income,
  }));

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Wealth & Cash Monitor</h1>
        <p className="text-sm text-muted-foreground">Live treasury position with forecasting</p>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Cash Position', value: metrics.cashPosition },
          { label: 'Available Custody', value: metrics.availableCustody },
          { label: 'Reserved Amounts', value: metrics.reservedAmounts },
          { label: 'Pending Settlements', value: metrics.pendingSettlements },
          { label: 'Subscription Monthly', value: metrics.subscriptionMonthly },
          { label: 'Investment Value', value: metrics.investmentValue },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p><p className="mt-2 text-2xl font-bold">{formatCurrency(m.value)}</p></CardContent></Card>
          </motion.div>
        ))}
      </div>
      <ChartCard title="Cash Flow Forecast (30/90/180/365 days)" data={forecastChart} type="stacked-bar" dataKeys={['projected', 'expenses', 'income']} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.forecasts.map((f) => (
          <Card key={f.horizon_days}><CardHeader className="pb-2"><CardTitle className="text-sm">{f.horizon_days}-Day Forecast</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{formatCurrency(f.projected_balance)}</p><p className="text-xs text-muted-foreground">Expenses: {formatCurrency(f.expected_expenses)}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
