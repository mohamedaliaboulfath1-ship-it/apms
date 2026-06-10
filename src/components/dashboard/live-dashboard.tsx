'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Users, CreditCard, ShoppingCart,
  FileWarning, FileCheck, TrendingUp, Percent, PieChart,
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ChartCard } from '@/components/charts/chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, formatPercentage, getRiskColor, getStatusColor } from '@/lib/utils/format';

interface LiveDashboardProps {
  kpis: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getDashboardKPIs>>;
  cashFlow: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getCashFlowTrend>>;
  employeeBalances: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getEmployeeBalanceChart>>;
  categories: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getExpenseCategoryChart>>;
  outstanding: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getOutstandingEmployeesRanking>>;
  recentInvoices: Awaited<ReturnType<typeof import('@/lib/actions/dashboard').getRecentInvoices>>;
  notifications: Awaited<ReturnType<typeof import('@/lib/actions/notifications').getNotifications>>;
}

export function LiveDashboard({
  kpis, cashFlow, employeeBalances, categories, outstanding, recentInvoices, notifications,
}: LiveDashboardProps) {
  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live custody overview · Real-time data from Supabase</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/wealth"><KPICard title="Custody Balance" value={formatCurrency(kpis.currentCustodyBalance)} subtitle="Available for distribution" icon={Wallet} variant="success" delay={0} /></Link>
        <Link href="/custody"><KPICard title="Total Distributed" value={formatCurrency(kpis.totalDistributed)} subtitle="This month" icon={ArrowUpRight} delay={0.05} /></Link>
        <Link href="/invoices?status=settled"><KPICard title="Total Settled" value={formatCurrency(kpis.totalSettled)} icon={ArrowDownRight} variant="success" delay={0.1} /></Link>
        <Link href="/employees"><KPICard title="Outstanding" value={formatCurrency(kpis.outstandingBalance)} subtitle={`${kpis.unsettledEmployees} employees`} icon={Users} variant="warning" delay={0.15} /></Link>
        <Link href="/card-expenses"><KPICard title="Card Spending" value={formatCurrency(kpis.cardSpending)} icon={CreditCard} delay={0.2} /></Link>
        <Link href="/custody?type=direct_purchase"><KPICard title="Direct Purchases" value={formatCurrency(kpis.directPurchases)} icon={ShoppingCart} delay={0.25} /></Link>
        <Link href="/missing-invoices"><KPICard title="Pending Documents" value={String(kpis.pendingDocuments)} icon={FileWarning} variant="danger" delay={0.3} /></Link>
        <Link href="/approvals"><KPICard title="Awaiting Review" value={String(kpis.invoicesAwaitingReview)} icon={FileCheck} variant="warning" delay={0.35} /></Link>
        <Link href="/wealth"><KPICard title="Monthly Spending" value={formatCurrency(kpis.monthlySpending)} icon={TrendingUp} delay={0.4} /></Link>
        <Link href="/reconciliation"><KPICard title="Settlement Rate" value={formatPercentage(kpis.monthlySettlementRate)} icon={Percent} variant="success" delay={0.45} /></Link>
        <Link href="/subscriptions"><KPICard title="Sub. Monthly Cost" value={formatCurrency(kpis.subscriptionMonthlyCost)} icon={CreditCard} delay={0.5} /></Link>
        <Link href="/investments"><KPICard title="Investment Value" value={formatCurrency(kpis.investmentValue)} subtitle={`ROI: ${kpis.investmentROI.toFixed(1)}%`} icon={PieChart} variant="success" delay={0.55} /></Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cash Flow Trend" data={cashFlow} type="area" dataKeys={['received', 'distributed', 'settled']} />
        <ChartCard title="Expense Categories" data={categories.length ? categories : [{ name: 'No data', value: 0 }]} type="pie" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Employee Balances" data={employeeBalances} type="stacked-bar" dataKeys={['settled', 'balance']} />
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Reconciliation Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Settlement Rate</span><span className="font-semibold">{kpis.monthlySettlementRate.toFixed(1)}%</span></div>
              <Progress value={kpis.monthlySettlementRate} className="h-2" />
            </div>
            <Link href="/reconciliation" className="block text-center text-xs text-primary hover:underline">Open Reconciliation Center →</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Outstanding Employees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {outstanding.length === 0 ? <p className="text-sm text-muted-foreground">All settled</p> : outstanding.slice(0, 5).map((emp, i) => (
              <Link key={emp.id} href={`/employees?id=${emp.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{emp.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="truncate text-sm font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.department}</p></div>
                <div className="text-right"><p className="text-sm font-semibold">{formatCurrency(Number(emp.balance?.outstanding_balance ?? 0))}</p><p className={`text-xs ${getRiskColor(emp.risk_score)}`}>Risk: {emp.risk_score}</p></div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
            <Link href="/invoices" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentInvoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet</p> : recentInvoices.map((inv) => (
              <Link key={inv.id} href={`/invoices?id=${inv.id}`} className="flex items-center justify-between rounded-lg border border-border/30 p-3 hover:bg-muted/30">
                <div><p className="text-sm font-medium">{inv.vendor_name ?? 'Unknown'}</p><p className="text-xs text-muted-foreground">{inv.invoice_number}</p></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(Number(inv.amount_after_vat))}</span>
                  <Badge variant="secondary" className={getStatusColor(inv.status)}>{inv.status}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
            <Link href="/notifications" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 ${n.is_read ? 'border-border/30 opacity-60' : 'border-primary/20 bg-primary/5'}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
