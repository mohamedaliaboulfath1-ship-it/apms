import {
  getDashboardKPIs,
  getCashFlowTrend,
  getEmployeeBalanceChart,
  getExpenseCategoryChart,
  getOutstandingEmployeesRanking,
  getRecentInvoices,
} from '@/lib/actions/dashboard';
import { getNotifications } from '@/lib/actions/notifications';
import { LiveDashboard } from '@/components/dashboard/live-dashboard';

export default async function DashboardPage() {
  const [kpis, cashFlow, employeeBalances, categories, outstanding, recentInvoices, notifications] =
    await Promise.all([
      getDashboardKPIs(),
      getCashFlowTrend(),
      getEmployeeBalanceChart(),
      getExpenseCategoryChart(),
      getOutstandingEmployeesRanking(),
      getRecentInvoices(5),
      getNotifications(),
    ]);

  return (
    <LiveDashboard
      kpis={kpis}
      cashFlow={cashFlow}
      employeeBalances={employeeBalances}
      categories={categories}
      outstanding={outstanding}
      recentInvoices={recentInvoices}
      notifications={notifications}
    />
  );
}
