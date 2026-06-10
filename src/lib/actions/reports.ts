'use server';

import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType =
  | 'employee-statement'
  | 'custody-statement'
  | 'monthly-settlement'
  | 'outstanding-advances'
  | 'missing-documents'
  | 'subscription-report'
  | 'investment-report'
  | 'executive-summary';

async function fetchReportData(type: ReportType) {
  const user = await requireSession();
  const supabase = await createClient();
  const companyId = user.company_id!;

  switch (type) {
    case 'employee-statement': {
      const { data } = await supabase.from('employees').select('*, employee_balances(*)').eq('company_id', companyId);
      return { title: 'Employee Custody Statement', rows: (data ?? []).map((e) => {
        const b = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
        return [e.name, e.department, Number(b?.total_transferred ?? 0), Number(b?.total_settled ?? 0), Number(b?.outstanding_balance ?? 0), `${Number(b?.settlement_percentage ?? 0).toFixed(1)}%`];
      }), headers: ['Employee', 'Department', 'Transferred', 'Settled', 'Outstanding', 'Settlement %'] };
    }
    case 'custody-statement': {
      const { data } = await supabase.from('custody_transactions').select('*, employees(name)').eq('company_id', companyId).order('transaction_date', { ascending: false });
      return { title: 'Custody Statement', rows: (data ?? []).map((t) => [t.transaction_date, t.type, (t.employees as { name: string })?.name ?? '-', Number(t.amount), t.reason ?? '']), headers: ['Date', 'Type', 'Employee', 'Amount', 'Reason'] };
    }
    case 'monthly-settlement': {
      const { data } = await supabase.from('invoices').select('*, employees(name)').eq('company_id', companyId).in('status', ['approved', 'settled']).order('invoice_date', { ascending: false });
      return { title: 'Monthly Settlement Report', rows: (data ?? []).map((i) => [i.invoice_number, i.invoice_date, i.vendor_name, (i.employees as { name: string })?.name ?? '-', Number(i.amount_after_vat), i.status]), headers: ['Invoice #', 'Date', 'Vendor', 'Employee', 'Amount', 'Status'] };
    }
    case 'outstanding-advances': {
      const { data } = await supabase.from('employees').select('name, department, risk_score, employee_balances(outstanding_balance)').eq('company_id', companyId);
      const filtered = (data ?? []).filter((e) => {
        const b = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
        return Number(b?.outstanding_balance ?? 0) > 0;
      });
      return { title: 'Outstanding Advances Report', rows: filtered.map((e) => {
        const b = Array.isArray(e.employee_balances) ? e.employee_balances[0] : e.employee_balances;
        return [e.name, e.department, Number(b?.outstanding_balance ?? 0), e.risk_score];
      }), headers: ['Employee', 'Department', 'Outstanding', 'Risk Score'] };
    }
    case 'missing-documents': {
      const { data } = await supabase.from('missing_documents').select('*, employees(name)').eq('company_id', companyId);
      return { title: 'Missing Documents Report', rows: (data ?? []).map((d) => [d.document_date, (d.employees as { name: string })?.name, d.description, Number(d.amount), d.risk_level, d.status]), headers: ['Date', 'Employee', 'Description', 'Amount', 'Risk', 'Status'] };
    }
    case 'subscription-report': {
      const { data } = await supabase.from('subscriptions').select('*').eq('company_id', companyId);
      return { title: 'Subscription Report', rows: (data ?? []).map((s) => [s.name, s.vendor_name, s.billing_cycle, Number(s.monthly_cost ?? s.annual_cost ?? 0), s.renewal_date, s.status]), headers: ['Name', 'Vendor', 'Billing', 'Cost', 'Renewal', 'Status'] };
    }
    case 'investment-report': {
      const { data } = await supabase.from('investments').select('*').eq('company_id', companyId);
      return { title: 'Investment Report', rows: (data ?? []).map((i) => [i.name, i.type, Number(i.capital), Number(i.current_value), Number(i.roi).toFixed(2), i.risk_level]), headers: ['Name', 'Type', 'Capital', 'Value', 'ROI %', 'Risk'] };
    }
    case 'executive-summary': {
      const { getDashboardKPIs } = await import('@/lib/actions/dashboard');
      const kpis = await getDashboardKPIs();
      return { title: 'Executive Summary', rows: Object.entries(kpis).map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').trim(), typeof v === 'number' ? v.toFixed(2) : String(v)]), headers: ['Metric', 'Value'] };
    }
    default:
      throw new Error('Unknown report type');
  }
}

export async function generateExcelReport(type: ReportType): Promise<ArrayBuffer> {
  const { title, rows, headers } = await fetchReportData(type);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function generatePDFReport(type: ReportType): Promise<ArrayBuffer> {
  const { title, rows, headers } = await fetchReportData(type);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  autoTable(doc, { head: [headers], body: rows as string[][], startY: 35, styles: { fontSize: 8 } });
  return doc.output('arraybuffer');
}

export async function generateCSVReport(type: ReportType): Promise<string> {
  const { rows, headers } = await fetchReportData(type);
  const lines = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))];
  return lines.join('\n');
}
