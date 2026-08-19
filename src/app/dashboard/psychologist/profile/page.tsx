import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { psychologistService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/shell';
import { PsychologistProfileForm } from '@/components/dashboard/psychologist-profile-form';

export const metadata: Metadata = { title: 'Mon profil' };

export default async function PsychologistProfilePage() {
  const psychologist = await psychologistService.getById(CURRENT_PSYCHOLOGIST_ID);
  if (!psychologist) notFound();

  return (
    <>
      <PageHeader
        title="Mon profil public"
        description="C’est ce que voient les patients avant de vous choisir."
        action={
          <Button variant="outline-muted" asChild>
            <Link href={`/psychologists/${psychologist.slug}`} target="_blank">
              <ExternalLink />
              Voir mon profil public
            </Link>
          </Button>
        }
      />
      <PsychologistProfileForm psychologist={psychologist} />
    </>
  );
}
