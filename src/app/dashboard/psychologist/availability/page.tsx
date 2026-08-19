import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { psychologistService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { AvailabilityEditor } from '@/components/dashboard/availability-editor';

export const metadata: Metadata = { title: 'Disponibilités' };

export default async function AvailabilityPage() {
  const psychologist = await psychologistService.getById(CURRENT_PSYCHOLOGIST_ID);
  if (!psychologist) notFound();

  return (
    <>
      <PageHeader
        title="Disponibilités"
        description="Définissez vos plages horaires récurrentes. Les patients ne peuvent réserver que dans ces créneaux."
      />
      <AvailabilityEditor psychologist={psychologist} />
    </>
  );
}
