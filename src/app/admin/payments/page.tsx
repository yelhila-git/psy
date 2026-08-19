import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { PaymentsTable } from '@/components/admin/payments-table';

export const metadata: Metadata = { title: 'Paiements' };

export default function AdminPaymentsPage() {
  return (
    <>
      <PageHeader
        title="Paiements"
        description="Transactions traitées par la plateforme, tous praticiens confondus."
      />
      <PaymentsTable />
    </>
  );
}
