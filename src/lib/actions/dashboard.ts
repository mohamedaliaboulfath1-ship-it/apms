'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { getSubscriptionCosts } from '@/lib/actions/subscriptions';
import { getPortfolioSummary } from '@/lib/actions/investments';
import { getCardSpendingSummary } from '@/lib/actions/card-expenses';

export async function getDashboardKPIs() {
  const user = await requireSession();
  const supabase = await createClient();
  const companyId = user.company_id!;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const [
    custodyRes,
    employeesRes,
    invoicesRes,
    missingRes,
    cardSummary,
    subCosts,
    portfolio,
    distributedRes,
    settledRes,
    directRes,
  ] = await Promise.all([
    supabase.from('custody_accounts').select('current_balance').eq('company_id', companyId).eq('is_active', true).single(),
    supabase.from('employees').select('id, employee_balances(outstanding_balance, settlement_percentage)').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('invoices').select('status, amount_after_vat').eq('company_id', companyId),
    supabase.from('missing_documents').select('id').eq('company_id', companyId).in('status', ['pending', 'overdue']),
    getCardSpendingSummary(),
    getSubscriptionCosts(),
    getPortfolioSummary(),
    supabase.from('custody_transactions').select('amount').eq('company_id', companyId).eq('type', 'employee_transfer').gte('transaction_date', startOfMonth),
    supabase.from('custody_transactions').select('amount').eq('company_id', companyId).eq('type', 'settlement').gte('transaction_date', startOfMonth),
    supabase.from('custody_transactions').select('amount').eq('company_id', companyId).eq('type', 'direct_purchase').gte('transaction_date', startOfMonth),
  ]);

  const employees = employeesRes.data ?? [];
  const outstandingBalance = employees.reduce((s, e) => {
    const bal = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
    return s + Number(bal?.outstanding_balance ?? 0);
  }, 0);

  const unsettledEmployees = employees.filter((e) => {
    const bal = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
    return Number(bal?.outstanding_balance ?? 0) > 0;
  }).length;

  const invoices = invoicesRes.data ?? [];
  const pendingReview = invoices.filter((i) => i.status === 'pending').length;
  const totalSettled = invoices.filter((i) => i.status === 'settled').reduce((s, i) => s + Number(i.amount_after_vat), 0);
  const totalDistributed = (distributedRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const monthlySettled = (settledRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const directPurchases = (directRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const monthlySpending = totalDistributed + directPurchases + cardSummary.total;
  const settlementRate = totalDistributed > 0 ? (monthlySettled / totalDistributed) * 100 : 0;

  return {
    currentCustodyBalance: Number(custodyRes.data?.current_balance ?? 0),
    totalDistributed,
    totalSettled: monthlySettled,
    outstandingBalance,
    unsettledEmployees,
    cardSpending: cardSummary.total,
    directPurchases,
    pendingDocuments: missingRes.data?.length ?? 0,
    invoicesAwaitingReview: pendingReview,
    monthlySpending,
    monthlySettlementRate: settlementRate,
    subscriptionMonthlyCost: subCosts.monthly,
    subscriptionAnnualCost: subCosts.annual,
    investmentValue: portfolio.totalValue,
    investmentROI: portfolio.totalROI,
  };
}

export async function getCashFlowTrend() {
  const user = await requireSession();
  const supabase = await createClient();
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().split('T')[0];
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const label = d.toLocaleString('en', { month: 'short' });

    const [received, distributed, settled] = await Promise.all([
      supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'main_receive').gte('transaction_date', start).lte('transaction_date', end),
      supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'employee_transfer').gte('transaction_date', start).lte('transaction_date', end),
      supabase.from('custody_transactions').select('amount').eq('company_id', user.company_id!).eq('type', 'settlement').gte('transaction_date', start).lte('transaction_date', end),
    ]);

    months.push({
      name: label,
      received: (received.data ?? []).reduce((s, t) => s + Number(t.amount), 0),
      distributed: (distributed.data ?? []).reduce((s, t) => s + Number(t.amount), 0),
      settled: (settled.data ?? []).reduce((s, t) => s + Number(t.amount), 0),
    });
  }
  return months;
}

export async function getEmployeeBalanceChart() {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('employees')
    .select('name, employee_balances(outstanding_balance, total_settled)')
    .eq('company_id', user.company_id!)
    .eq('status', 'active');

  return (data ?? []).map((e) => {
    const bal = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
    return {
      name: e.name.split(' ')[0],
      balance: Number(bal?.outstanding_balance ?? 0),
      settled: Number(bal?.total_settled ?? 0),
    };
  });
}

export async function getExpenseCategoryChart() {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('amount_after_vat, expense_categories(name)')
    .eq('company_id', user.company_id!)
    .in('status', ['approved', 'settled']);

  const grouped: Record<string, number> = {};
  for (const inv of data ?? []) {
    const cats = inv.expense_categories as { name: string } | { name: string }[] | null;
    const cat = (Array.isArray(cats) ? cats[0]?.name : cats?.name) ?? 'Other';
    grouped[cat] = (grouped[cat] ?? 0) + Number(inv.amount_after_vat);
  }
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

export async function getOutstandingEmployeesRanking() {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('employees')
    .select('id, name, department, risk_score, employee_balances(outstanding_balance, settlement_percentage)')
    .eq('company_id', user.company_id!)
    .eq('status', 'active');

  return (data ?? [])
    .map((e) => {
      const bal = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
      return { ...e, balance: bal };
    })
    .filter((e) => Number(e.balance?.outstanding_balance ?? 0) > 0)
    .sort((a, b) => Number(b.balance?.outstanding_balance ?? 0) - Number(a.balance?.outstanding_balance ?? 0));
}

export async function getRecentInvoices(limit = 5) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('*, employees(name)')
    .eq('company_id', user.company_id!)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getActivityLogs(limit = 20) {
  const user = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from('activity_logs')
    .select('*, users(full_name)')
    .eq('company_id', user.company_id!)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
