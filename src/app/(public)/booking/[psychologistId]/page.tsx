import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { psychologistService } from '@/lib/services';
import { BookingFlow } from '@/components/booking/booking-flow';

export const metadata: Metadata = {
  title: 'Réserver une consultation',
  robots: { index: false, follow: false },
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ psychologistId: string }>;
  searchParams: Promise<{ start?: string; duration?: string }>;
}) {
  const { psychologistId } = await params;
  const { start, duration } = await searchParams;

  const psychologist = await psychologistService.getById(psychologistId);
  if (!psychologist) notFound();

  return (
    <div className="bg-surface-alt py-10 lg:py-14">
      <div className="container-page">
        <Link
          href={`/psychologists/${psychologist.slug}`}
          className="inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4 rtl-flip" />
          Retour au profil
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-secondary">
          Réserver avec {psychologist.fullName}
        </h1>
        <p className="mt-2 text-md text-muted-foreground">
          Trois étapes, moins de deux minutes.
        </p>

        <div className="mt-8">
          <BookingFlow
            psychologist={psychologist}
            presetStart={start}
            presetDuration={duration ? Number(duration) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
