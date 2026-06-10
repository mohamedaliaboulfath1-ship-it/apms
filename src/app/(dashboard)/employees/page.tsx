import { getEmployees } from '@/lib/actions/employees';
import { EmployeesClient } from '@/components/modules/employees-client';

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return <EmployeesClient initialData={employees} />;
}
