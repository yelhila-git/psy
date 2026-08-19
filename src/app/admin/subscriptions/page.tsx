import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { SubscriptionsTable } from '@/components/admin/subscriptions-table';

export const metadata: Metadata = { title: 'Abonnements' };

export default function AdminSubscriptionsPage() {
  return (
    <>
      <PageHeader
        title="Abonnements"
        description="Les formules souscrites par les praticiens — l’unique source de revenus de la plateforme."
      />
      <SubscriptionsTable />
    </>
  );
}
