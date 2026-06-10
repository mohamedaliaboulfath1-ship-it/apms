import { getInvoices } from '@/lib/actions/invoices';
import { InvoicesClient } from '@/components/modules/invoices-client';

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  return <InvoicesClient initialData={invoices} />;
}
