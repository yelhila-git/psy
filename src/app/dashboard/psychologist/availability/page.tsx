import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { currentPsychologist } from '@/lib/session';
import { PageHeader } from '@/components/dashboard/shell';
import { AvailabilityEditor } from '@/components/dashboard/availability-editor';

export const metadata: Metadata = { title: 'Disponibilités' };

export default async function AvailabilityPage() {
  const psychologist = await currentPsychologist();
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
