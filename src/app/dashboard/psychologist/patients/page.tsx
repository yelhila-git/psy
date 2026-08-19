import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { patientService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { EmptyState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/dashboard/shell';
import { PatientTable } from '@/components/dashboard/patient-table';

export const metadata: Metadata = { title: 'Mes patients' };

export default async function PsychologistPatientsPage() {
  const patients = await patientService.forPsychologist(CURRENT_PSYCHOLOGIST_ID);

  return (
    <>
      <PageHeader
        title="Mes patients"
        description={`${patients.length} personne${patients.length > 1 ? 's' : ''} suivie${patients.length > 1 ? 's' : ''} sur la plateforme.`}
      />

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun patient pour l’instant"
          description="Vos patients apparaîtront ici après leur première consultation."
          action={{ label: 'Ouvrir des créneaux', href: '/dashboard/psychologist/availability' }}
        />
      ) : (
        <PatientTable patients={patients} />
      )}
    </>
  );
}
