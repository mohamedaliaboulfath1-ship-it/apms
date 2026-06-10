'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { getSubscriptionCosts } from '@/lib/actions/subscriptions';
import { getPortfolioSummary } from '@/lib/actions/investments';

export async function generateForecast(horizonDays: 30 | 90 | 180 | 365) {
  const user = await requireSession();
  const supabase = await createClient();

  const [custody, employees, subCosts, portfolio] = await Promise.all([
    supabase.from('custody_accounts').select('current_balance').eq('company_id', user.company_id!).single(),
    supabase.from('employee_balances').select('outstanding_balance').in('employee_id',
      (await supabase.from('employees').select('id').eq('company_id', user.company_id!)).data?.map((e) => e.id) ?? []
    ),
    getSubscriptionCosts(),
    getPortfolioSummary(),
  ]);

  const currentCash = Number(custody.data?.current_balance ?? 0);
  const outstandingAdvances = (employees.data ?? []).reduce((s, e) => s + Number(e.outstanding_balance), 0);

  const monthsInHorizon = horizonDays / 30;
  const subscriptionForecast = subCosts.monthly * monthsInHorizon;
  const investmentIncome = portfolio.monthlyIncome * monthsInHorizon;

  const future = new Date();
  future.setDate(future.getDate() + horizonDays);
  const end = future.toISOString().split('T')[0];
  const start = new Date().toISOString().split('T')[0];

  const { data: expectedTx } = await supabase
    .from('custody_transactions')
    .select('amount, type')
    .eq('company_id', user.company_id!)
    .gte('transaction_date', start)
    .lte('transaction_date', end);

  const expectedExpenses = subscriptionForecast + outstandingAdvances * 0.5;
  const projectedBalance = currentCash - expectedExpenses + investmentIncome;

  const forecast = {
    horizon_days: horizonDays,
    current_cash: currentCash,
    expected_expenses: expectedExpenses,
    outstanding_advances: outstandingAdvances,
    subscription_forecast: subscriptionForecast,
    investment_income: investmentIncome,
    projected_balance: projectedBalance,
  };

  await supabase.from('cash_forecasts').upsert({
    company_id: user.company_id!,
    forecast_date: start,
    horizon_days: horizonDays,
    current_cash: currentCash,
    expected_expenses: expectedExpenses,
    outstanding_advances: outstandingAdvances,
    subscription_forecast: subscriptionForecast,
    investment_income: investmentIncome,
    projected_balance: projectedBalance,
  }, { onConflict: 'company_id,forecast_date,horizon_days' });

  return forecast;
}

export async function getAllForecasts() {
  const horizons = [30, 90, 180, 365] as const;
  const results = await Promise.all(horizons.map((h) => generateForecast(h)));
  return results;
}

export async function getWealthMetrics() {
  const user = await requireSession();
  const supabase = await createClient();

  const [custody, portfolio, subCosts, pendingSettlements, forecasts] = await Promise.all([
    supabase.from('custody_accounts').select('current_balance').eq('company_id', user.company_id!).single(),
    getPortfolioSummary(),
    getSubscriptionCosts(),
    supabase.from('settlement_requests').select('amount').eq('company_id', user.company_id!).eq('status', 'pending'),
    getAllForecasts(),
  ]);

  const currentCash = Number(custody.data?.current_balance ?? 0);
  const pendingAmount = (pendingSettlements.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const reserved = forecasts[0]?.outstanding_advances ?? 0;

  return {
    cashPosition: currentCash,
    availableCustody: currentCash - reserved,
    reservedAmounts: reserved,
    pendingSettlements: pendingAmount,
    subscriptionMonthly: subCosts.monthly,
    subscriptionAnnual: subCosts.annual,
    investmentValue: portfolio.totalValue,
    investmentROI: portfolio.totalROI,
    forecasts,
    portfolio,
  };
}
