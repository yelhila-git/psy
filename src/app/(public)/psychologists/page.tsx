import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { Specialty } from '@/types';
import { SPECIALTIES } from '@/lib/constants';
import { Marketplace } from '@/components/psychologists/marketplace';

export const metadata: Metadata = {
  title: 'Trouver un psychologue',
  description:
    'Parcourez les psychologues vérifiés d’AlloMonPsy. Filtrez par spécialité, langue, tarif et disponibilité, puis réservez votre consultation en ligne.',
};

/**
 * Never trust the query string: an unknown `?specialty=` value is dropped
 * rather than passed through to the filter, which would silently return zero
 * results with no explanation.
 */
function parseSpecialty(value?: string): Specialty | null {
  if (!value) return null;
  const match = SPECIALTIES.find((s) => s.value === value);
  return match ? match.value : null;
}

export default async function PsychologistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>;
}) {
  const { q, specialty } = await searchParams;
  const activeSpecialty = parseSpecialty(specialty);
  const specialtyLabel = activeSpecialty
    ? SPECIALTIES.find((s) => s.value === activeSpecialty)!.label
    : null;

  return (
    <>
      <section className="border-b border-border bg-surface-alt">
        <div className="container-page py-10 lg:py-14">
          {specialtyLabel ? (
            <>
              <Link
                href="/psychologists"
                className="inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <ChevronLeft className="size-4 rtl-flip" />
                Tous les psychologues
              </Link>
              <p className="eyebrow mt-4">Motif de consultation</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-secondary sm:text-4xl">
                {specialtyLabel}
              </h1>
              <p className="mt-4 max-w-2xl text-md leading-relaxed text-muted-foreground">
                Ces praticiens sont spécialisés dans ce motif et vérifiés par notre équipe. Vous
                pouvez affiner par langue, tarif ou disponibilité, ou retirer le filtre pour voir
                tous les profils.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">Nos psychologues</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-secondary sm:text-4xl">
                Trouvez le praticien qui vous correspond
              </h1>
              <p className="mt-4 max-w-2xl text-md leading-relaxed text-muted-foreground">
                Tous les profils ci-dessous ont été vérifiés par notre équipe : diplôme,
                autorisation d’exercice et identité. Affinez la recherche selon ce qui compte pour
                vous.
              </p>
            </>
          )}
        </div>
      </section>

      {/* `key` remounts the client filter state when the specialty changes,
          so navigating between two category links actually reapplies it. */}
      <Marketplace
        key={activeSpecialty ?? 'all'}
        initialQuery={q ?? ''}
        initialSpecialties={activeSpecialty ? [activeSpecialty] : []}
      />
    </>
  );
}
