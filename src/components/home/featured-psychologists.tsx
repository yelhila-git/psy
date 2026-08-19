import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Psychologist } from '@/types';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/feedback';
import { PsychologistCard } from '@/components/psychologists/psychologist-card';

export function FeaturedPsychologists({ psychologists }: { psychologists: Psychologist[] }) {
  return (
    <section className="bg-surface/40 py-section-sm lg:py-section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Nos psychologues"
          title="Trouvez un psychologue"
          description="Des praticiens diplômés, vérifiés et disponibles cette semaine. Chaque profil précise sa spécialité, ses langues et son approche."
          action={
            <Button variant="outline" asChild>
              <Link href="/psychologists">
                Voir tous les profils
                <ArrowRight className="rtl-flip" />
              </Link>
            </Button>
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {psychologists.map((p) => (
            <PsychologistCard key={p.id} psychologist={p} />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Button full asChild>
            <Link href="/psychologists">Voir tous les psychologues</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
