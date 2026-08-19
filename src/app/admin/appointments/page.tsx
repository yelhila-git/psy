import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { AppointmentsTable } from '@/components/admin/appointments-table';

export const metadata: Metadata = { title: 'Rendez-vous' };

export default function AdminAppointmentsPage() {
  return (
    <>
      <PageHeader
        title="Rendez-vous"
        description="Toutes les consultations de la plateforme, filtrables par période."
      />
      <AppointmentsTable />
    </>
  );
}
