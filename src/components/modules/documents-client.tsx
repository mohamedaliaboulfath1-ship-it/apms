'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/files/file-upload';
import { getDocuments, getDownloadUrl } from '@/lib/actions/documents';
import { Download, File, Search } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentsClient({ initialData }: { initialData: Awaited<ReturnType<typeof getDocuments>> }) {
  const [search, setSearch] = useState('');
  const { data, refetch } = useQuery({
    queryKey: ['documents', search],
    queryFn: () => getDocuments({ search: search || undefined }),
    initialData,
  });

  async function download(id: string) {
    const r = await getDownloadUrl(id);
    if (r.url) window.open(r.url, '_blank');
    else toast.error(r.error ?? 'Failed');
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Document Archive</h1>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <FileUpload bucket="invoices" entityType="general" entityId="archive" onSuccess={() => refetch()} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-start gap-3 p-4">
              <File className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{doc.title ?? doc.file_name}</p>
                <p className="text-xs text-muted-foreground">{doc.bucket} · v{doc.current_version}</p>
                <div className="mt-1 flex flex-wrap gap-1">{(doc.tags as string[] ?? []).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => download(doc.id)}><Download className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
