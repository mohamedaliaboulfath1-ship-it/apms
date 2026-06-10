import { getDocuments } from '@/lib/actions/documents';
import { DocumentsClient } from '@/components/modules/documents-client';

export default async function DocumentsPage() {
  const documents = await getDocuments();
  return <DocumentsClient initialData={documents} />;
}
