import type { Metadata } from 'next';
import { patientService } from '@/lib/services';
import { PageHeader } from '@/components/dashboard/shell';
import { PatientProfileForm } from '@/components/dashboard/patient-profile-form';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function PatientProfilePage() {
  const patient = await patientService.current();

  return (
    <>
      <PageHeader
        title="Mon profil"
        description="Ces informations ne sont visibles que par les psychologues que vous consultez."
      />
      <PatientProfileForm patient={patient} />
    </>
  );
}
