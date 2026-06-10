'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPendingApprovals, processApproval, getAuditLogs } from '@/lib/actions/approvals';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export function ApprovalsClient({
  initialApprovals, auditLogs,
}: {
  initialApprovals: Awaited<ReturnType<typeof getPendingApprovals>>;
  auditLogs: Awaited<ReturnType<typeof getAuditLogs>>;
}) {
  const qc = useQueryClient();
  const { data: approvals } = useQuery({ queryKey: ['approvals'], queryFn: () => getPendingApprovals(), initialData: initialApprovals });

  async function handle(id: string, action: 'approved' | 'rejected' | 'correction_requested') {
    const r = await processApproval(id, action);
    if (r.error) toast.error(r.error);
    else { toast.success(`${action}`); qc.invalidateQueries({ queryKey: ['approvals'] }); }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Approvals & Audit</h1>
      <Tabs defaultValue="pending">
        <TabsList><TabsTrigger value="pending">Pending ({approvals?.length ?? 0})</TabsTrigger><TabsTrigger value="audit">Audit Trail</TabsTrigger></TabsList>
        <TabsContent value="pending" className="space-y-3 mt-4">
          {(approvals ?? []).length === 0 ? <p className="text-muted-foreground">No pending approvals</p> : (approvals ?? []).map((a) => {
            const entity = a.entity as Record<string, unknown> | undefined;
            return (
              <Card key={a.id}><CardContent className="flex items-center justify-between p-4">
                <div><Badge variant="outline">{a.entity_type}</Badge><p className="mt-1 font-medium">{String(entity?.description ?? entity?.invoice_number ?? a.id)}</p>
                  {entity?.amount_after_vat != null && <p className="text-sm">{formatCurrency(Number(entity.amount_after_vat))}</p>}</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handle(a.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handle(a.id, 'correction_requested')}>Request Fix</Button>
                  <Button size="sm" variant="ghost" onClick={() => handle(a.id, 'rejected')}>Reject</Button>
                </div>
              </CardContent></Card>
            );
          })}
        </TabsContent>
        <TabsContent value="audit" className="space-y-2 mt-4">
          {auditLogs.map((log) => (
            <Card key={log.id}><CardContent className="p-3 text-sm">
              <div className="flex justify-between"><span className="font-medium">{log.action} · {log.entity_type}</span><span className="text-muted-foreground">{formatDate(log.created_at)}</span></div>
              <p className="text-muted-foreground">{(log.users as { full_name: string } | null)?.full_name ?? 'System'}</p>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
