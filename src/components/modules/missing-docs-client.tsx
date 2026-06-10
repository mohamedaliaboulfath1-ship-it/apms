'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, StatusBadge } from '@/components/shared/data-table';
import { getMissingDocuments, resolveMissingDocument } from '@/lib/actions/missing-documents';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function MissingDocsClient({ initialData }: { initialData: Awaited<ReturnType<typeof getMissingDocuments>> }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['missing-docs'], queryFn: () => getMissingDocuments(), initialData });

  async function resolve(id: string, status: 'received' | 'waived') {
    const r = await resolveMissingDocument(id, status);
    if (r.error) toast.error(r.error);
    else { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['missing-docs'] }); }
  }

  return (
    <DataTable
      title="Missing Invoice Workflow"
      description="Live missing document tracking"
      data={(data ?? []).map((d) => ({ ...d, id: d.id, employee_name: (d.employees as { name: string } | null)?.name }))}
      searchPlaceholder="Search..."
      columns={[
        { key: 'document_date', header: 'Date', render: (d) => formatDate(d.document_date) },
        { key: 'employee_name', header: 'Employee' },
        { key: 'amount', header: 'Amount', render: (d) => formatCurrency(Number(d.amount)) },
        { key: 'description', header: 'Description' },
        { key: 'risk_level', header: 'Risk', render: (d) => <StatusBadge status={d.risk_level} /> },
        { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
        { key: 'actions', header: '', render: (d) => d.status === 'pending' ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => resolve(d.id, 'received')}>Received</Button>
            <Button size="sm" variant="ghost" onClick={() => resolve(d.id, 'waived')}>Waive</Button>
          </div>
        ) : null },
      ]}
    />
  );
}
