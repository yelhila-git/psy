import Link from 'next/link';
import { CalendarDays, Search, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/feedback';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Trouvez votre psychologue',
    description:
      'Filtrez par spécialité, langue, tarif ou disponibilité. Chaque profil détaille le parcours, l’approche thérapeutique et les avis de patients réellement suivis.',
  },
  {
    number: '02',
    icon: CalendarDays,
    title: 'Choisissez votre rendez-vous',
    description:
      'Sélectionnez le créneau et la durée qui vous conviennent dans l’agenda du praticien, puis réglez en ligne. Vous recevez la confirmation immédiatement.',
  },
  {
    number: '03',
    icon: Video,
    title: 'Démarrez votre consultation',
    description:
      'Rejoignez la visioconférence en un clic, sans installation. La séance se déroule dans un espace privé et chiffré, depuis l’appareil de votre choix.',
  },
];

/**
 * Three numbered steps. The large ghost numerals and the connecting rule come
 * from the Figma's "What we do" treatment.
 */
export function HowItWorks() {
  return (
    <section className="bg-background py-section-sm lg:py-section">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Comment ça marche"
          title="Trois étapes, et vous êtes accompagné"
          description="Pas de salle d’attente, pas de démarche compliquée. De la recherche à la séance, tout se fait en ligne."
        />

        <ol className="relative mt-14 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {/* Connector rule behind the cards on desktop. */}
          <span
            className="pointer-events-none absolute inset-x-[16%] top-[52px] hidden border-t-2 border-dashed border-border-strong lg:block"
            aria-hidden
          />

          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <li key={number} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex size-[104px] items-center justify-center rounded-full border border-border bg-card shadow-card">
                <Icon className="size-9 text-primary" aria-hidden />
                <span className="absolute -end-1 -top-1 flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                  {number}
                </span>
              </span>

              <h3 className="mt-6 text-lg font-bold text-secondary">{title}</h3>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/psychologists">Commencer maintenant</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
