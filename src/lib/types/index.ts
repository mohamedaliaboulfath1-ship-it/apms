export type UserRole = 'admin' | 'accountant' | 'manager' | 'employee' | 'viewer';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended';
export type TransferMethod = 'bank_transfer' | 'cash' | 'card';
export type InvoiceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'settled';
export type PaymentMethod = 'custody' | 'card' | 'cash' | 'bank_transfer';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type SubscriptionBilling = 'monthly' | 'annual' | 'quarterly';
export type ReconciliationStatus = 'green' | 'yellow' | 'red' | 'pending';
export type DocumentStatus = 'pending' | 'received' | 'waived' | 'overdue';
export type CustodyTxType =
  | 'main_receive'
  | 'employee_transfer'
  | 'employee_return'
  | 'direct_purchase'
  | 'settlement'
  | 'adjustment';

export interface Company {
  id: string;
  name: string;
  name_ar?: string;
  tax_number?: string;
  currency: string;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
}

export interface Employee {
  id: string;
  company_id: string;
  name: string;
  name_ar?: string;
  department: string;
  position?: string;
  phone?: string;
  email?: string;
  status: EmployeeStatus;
  risk_score: number;
  balance?: EmployeeBalance;
  last_activity?: string;
}

export interface EmployeeBalance {
  total_transferred: number;
  total_settled: number;
  total_returned: number;
  outstanding_balance: number;
  settlement_percentage: number;
  last_activity_at?: string;
}

export interface CustodyAccount {
  id: string;
  company_id: string;
  holder_name: string;
  name: string;
  current_balance: number;
  monthly_limit: number;
  currency: string;
  is_active: boolean;
}

export interface CustodyTransaction {
  id: string;
  company_id: string;
  custody_account_id: string;
  employee_id?: string;
  employee_name?: string;
  type: CustodyTxType;
  amount: number;
  transfer_method?: TransferMethod;
  reference_number?: string;
  reason?: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_date: string;
  vendor_name?: string;
  description?: string;
  category?: string;
  department?: string;
  amount_before_vat: number;
  vat_amount: number;
  amount_after_vat: number;
  currency: string;
  payment_method: PaymentMethod;
  employee_id?: string;
  employee_name?: string;
  status: InvoiceStatus;
  created_at: string;
}

export interface MissingDocument {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name?: string;
  document_date: string;
  amount: number;
  description: string;
  reason?: string;
  expected_date?: string;
  risk_level: RiskLevel;
  status: DocumentStatus;
  manager_notes?: string;
  created_at: string;
}

export interface CardTransaction {
  id: string;
  company_id: string;
  card_name: string;
  transaction_date: string;
  vendor_name?: string;
  description?: string;
  category?: string;
  amount: number;
  currency: string;
  is_subscription: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  vendor_name: string;
  name: string;
  category?: string;
  billing_cycle: SubscriptionBilling;
  monthly_cost?: number;
  annual_cost?: number;
  renewal_date: string;
  owner_name?: string;
  payment_method: PaymentMethod;
  status: SubscriptionStatus;
  auto_renewal: boolean;
  alert_days_before: number;
}

export interface Reconciliation {
  id: string;
  company_id: string;
  period_month: number;
  period_year: number;
  opening_balance: number;
  received_custody: number;
  total_distributed: number;
  total_settled: number;
  direct_purchases: number;
  card_purchases: number;
  closing_balance: number;
  expected_bank_balance?: number;
  actual_bank_balance?: number;
  difference?: number;
  supporting_docs_pct: number;
  missing_docs_pct: number;
  status: ReconciliationStatus;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardKPIs {
  currentCustodyBalance: number;
  totalDistributed: number;
  totalSettled: number;
  outstandingBalance: number;
  unsettledEmployees: number;
  cardSpending: number;
  directPurchases: number;
  pendingDocuments: number;
  invoicesAwaitingReview: number;
  monthlySpending: number;
  monthlySettlementRate: number;
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}
