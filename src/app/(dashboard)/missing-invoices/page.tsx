import { getMissingDocuments } from '@/lib/actions/missing-documents';
import { MissingDocsClient } from '@/components/modules/missing-docs-client';

export default async function MissingInvoicesPage() {
  const data = await getMissingDocuments();
  return <MissingDocsClient initialData={data} />;
}
