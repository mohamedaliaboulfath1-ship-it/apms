'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, StatusBadge } from '@/components/shared/data-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEmployees, createEmployee } from '@/lib/actions/employees';
import { formatCurrency, formatDate, getRiskColor } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function EmployeesClient({ initialData }: { initialData: Awaited<ReturnType<typeof getEmployees>> }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees(),
    initialData,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createEmployee(new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) toast.error(result.error);
    else { toast.success('Employee created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['employees'] }); }
  }

  if (isLoading) return <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <>
      <DataTable
        title="Employees"
        description="Live employee custody balances from Supabase"
        data={employees.map((e) => ({ ...e, id: e.id }))}
        searchPlaceholder="Search employees..."
        addLabel="Add Employee"
        onAdd={() => setShowForm(true)}
        columns={[
          { key: 'name', header: 'Employee', render: (emp) => (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{emp.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
              <div><p className="font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.email}</p></div>
            </div>
          )},
          { key: 'department', header: 'Department' },
          { key: 'position', header: 'Position' },
          { key: 'balance', header: 'Outstanding', render: (emp) => {
            const b = Array.isArray(emp.employee_balances) ? emp.employee_balances[0] : emp.employee_balances;
            return <span className="font-semibold">{formatCurrency(Number(b?.outstanding_balance ?? 0))}</span>;
          }},
          { key: 'settlement', header: 'Settlement', render: (emp) => {
            const b = Array.isArray(emp.employee_balances) ? emp.employee_balances[0] : emp.employee_balances;
            const pct = Number(b?.settlement_percentage ?? 0);
            return <div className="w-24 space-y-1"><Progress value={pct} className="h-1.5" /><span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span></div>;
          }},
          { key: 'risk_score', header: 'Risk', render: (emp) => <span className={`font-semibold ${getRiskColor(emp.risk_score)}`}>{emp.risk_score}</span> },
          { key: 'status', header: 'Status', render: (emp) => <StatusBadge status={emp.status} /> },
        ]}
      />
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
            <div className="space-y-2"><Label>Department</Label><Input name="department" required /></div>
            <div className="space-y-2"><Label>Position</Label><Input name="position" /></div>
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input name="phone" /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select name="status" defaultValue="active"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">Create Employee</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
