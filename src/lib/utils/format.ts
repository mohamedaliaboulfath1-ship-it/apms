export function formatCurrency(
  amount: number,
  currency: string = 'SAR',
  locale: string = 'en-SA'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(date: string | Date, locale: string = 'en-SA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    approved: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
    settled: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    draft: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    overdue: 'bg-red-500/10 text-red-600 dark:text-red-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    critical: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return colors[status] ?? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
}

export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-red-500';
  if (score >= 60) return 'text-orange-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-emerald-500';
}
