export type UserRole =
  | 'super_admin'
  | 'finance_manager'
  | 'accountant'
  | 'employee'
  | 'auditor';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  finance_manager: 'Finance Manager',
  accountant: 'Accountant',
  employee: 'Employee',
  auditor: 'Auditor',
};

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'finance_manager', 'accountant'];
export const WRITE_ROLES: UserRole[] = ['super_admin', 'finance_manager', 'accountant'];
export const APPROVE_ROLES: UserRole[] = ['super_admin', 'finance_manager', 'accountant'];

export function canWrite(role: UserRole): boolean {
  return WRITE_ROLES.includes(role);
}

export function canApprove(role: UserRole): boolean {
  return APPROVE_ROLES.includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canAccessDashboard(role: UserRole): boolean {
  return role !== 'employee';
}

export function canAccessPortal(role: UserRole): boolean {
  return true;
}

export const PERMISSIONS = {
  employees: { read: [...ADMIN_ROLES, 'auditor'], write: WRITE_ROLES },
  custody: { read: [...ADMIN_ROLES, 'auditor'], write: WRITE_ROLES },
  invoices: { read: [...ADMIN_ROLES, 'auditor', 'employee'], write: WRITE_ROLES, submit: ['employee', ...WRITE_ROLES] },
  approvals: { read: ADMIN_ROLES, write: APPROVE_ROLES },
  investments: { read: ADMIN_ROLES, write: ['super_admin', 'finance_manager'] },
  reports: { read: [...ADMIN_ROLES, 'auditor'], write: WRITE_ROLES },
  settings: { read: ADMIN_ROLES, write: ['super_admin', 'finance_manager'] },
} as const;

export function hasPermission(
  role: UserRole,
  resource: keyof typeof PERMISSIONS,
  action: 'read' | 'write' | 'submit'
): boolean {
  const perms = PERMISSIONS[resource];
  return (perms[action as keyof typeof perms] as UserRole[] | undefined)?.includes(role) ?? false;
}
