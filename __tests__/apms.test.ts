import { describe, it, expect } from 'vitest';
import { canWrite, canApprove, isAdmin, hasPermission } from '@/lib/auth/roles';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';

describe('RBAC', () => {
  it('allows accountants to write', () => {
    expect(canWrite('accountant')).toBe(true);
    expect(canWrite('employee')).toBe(false);
  });

  it('allows finance managers to approve', () => {
    expect(canApprove('finance_manager')).toBe(true);
    expect(canApprove('auditor')).toBe(false);
  });

  it('identifies admin roles', () => {
    expect(isAdmin('super_admin')).toBe(true);
    expect(isAdmin('employee')).toBe(false);
  });

  it('checks permissions matrix', () => {
    expect(hasPermission('accountant', 'invoices', 'write')).toBe(true);
    expect(hasPermission('employee', 'settings', 'write')).toBe(false);
  });
});

describe('Format utilities', () => {
  it('formats currency in SAR', () => {
    expect(formatCurrency(5000)).toContain('5');
  });

  it('formats percentage', () => {
    expect(formatPercentage(78.9)).toBe('78.9%');
  });
});
