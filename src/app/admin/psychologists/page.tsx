import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { VerificationTable } from '@/components/admin/verification-table';

export const metadata: Metadata = { title: 'Psychologues' };

export default function AdminPsychologistsPage() {
  return (
    <>
      <PageHeader
        title="Psychologues"
        description="Vérifiez les dossiers, approuvez ou refusez les profils, et gérez les praticiens déjà en ligne."
      />
      <VerificationTable />
    </>
  );
}
