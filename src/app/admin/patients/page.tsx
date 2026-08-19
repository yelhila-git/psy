import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { PatientsTable } from '@/components/admin/patients-table';

export const metadata: Metadata = { title: 'Patients' };

export default function AdminPatientsPage() {
  return (
    <>
      <PageHeader
        title="Patients"
        description="Comptes patients enregistrés sur la plateforme."
      />
      <PatientsTable />
    </>
  );
}
