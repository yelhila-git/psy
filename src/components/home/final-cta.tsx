import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PATIENT_POINTS = [
  'Première séance sans engagement',
  'Annulation gratuite jusqu’à 24 h avant',
  'Praticiens vérifiés un par un',
];

const PSY_POINTS = [
  'Agenda, paiements et visio réunis',
  'Vous fixez votre tarif et vos créneaux',
  'Versement des revenus chaque mois',
];

const PATIENT_IMAGE =
  'https://images.unsplash.com/photo-1541199249251-f713e6145474?q=80&w=900&auto=format&fit=crop';
const PSY_IMAGE =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=900&auto=format&fit=crop';

const CARD_SIZES = '(min-width: 1024px) 50vw, 100vw';

/**
 * Closing CTA. The homepage serves two audiences, so it splits rather than
 * forcing one of them into a secondary link.
 *
 * The pair is deliberately asymmetric in tone but identical in structure: both
 * cards lead with a photograph and an audience badge, then one resolves dark
 * (navy, the emotional ask) and the other light (the commercial one). Matching
 * the layout keeps them readable as a single choice; splitting the colour stops
 * the visitor having to read both to work out which one is meant for them.
 */
export function FinalCTA() {
  return (
    // `background` rather than `surface-alt`: the section above it is already
    // surface-alt, and two adjacent tinted bands merge into one long block.
    <section className="relative overflow-hidden bg-background py-section-sm wash-mint lg:py-section">
      <div className="container-page">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <AudienceCard
            tone="dark"
            image={PATIENT_IMAGE}
            badge="Vous cherchez un soutien"
            title="Le bon psychologue est à quelques clics"
            description="Parcourez les profils, comparez les approches et réservez le créneau qui vous convient. Vous n’avez rien à préparer pour la première séance."
            points={PATIENT_POINTS}
            actions={
              <Button size="lg" variant="onDark" asChild>
                <Link href="/psychologists">
                  Trouver un psychologue
                  <ArrowRight className="rtl-flip" />
                </Link>
              </Button>
            }
          />

          <AudienceCard
            tone="light"
            image={PSY_IMAGE}
            badge="Vous êtes praticien"
            title="Développez votre patientèle en ligne"
            description="Créez votre profil, faites vérifier vos diplômes et recevez vos premières demandes. Vous gardez la main sur vos tarifs, vos disponibilités et votre façon de travailler."
            points={PSY_POINTS}
            actions={
              <>
                <Button size="lg" asChild>
                  <Link href="/register/psychologist">Créer mon profil</Link>
                </Button>
                <Button size="lg" variant="outline-muted" asChild>
                  <Link href="/how-it-works">En savoir plus</Link>
                </Button>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  tone,
  image,
  badge,
  title,
  description,
  points,
  actions,
}: {
  tone: 'dark' | 'light';
  image: string;
  badge: string;
  title: string;
  description: string;
  points: string[];
  actions: React.ReactNode;
}) {
  const isDark = tone === 'dark';

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl shadow-card transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-card-hover',
        isDark ? 'bg-secondary' : 'border border-border bg-card',
      )}
    >
      {/* Photograph — decorative, so the alt stays empty: the badge and heading
          below already carry the meaning for assistive tech. */}
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[2/1] lg:aspect-[16/9]">
        <Image
          src={image}
          alt=""
          fill
          draggable={false}
          sizes={CARD_SIZES}
          className="object-cover object-center saturate-[0.9] transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Scrim fades into the content area so the photo and the panel below
            read as one surface rather than a picture stuck on a box. */}
        <div
          className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-gradient-to-t from-secondary via-secondary/30 to-transparent'
              : 'bg-gradient-to-t from-card via-card/20 to-transparent',
          )}
          aria-hidden
        />

        <span
          className={cn(
            'absolute start-6 top-6 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] shadow-sm backdrop-blur-sm',
            isDark ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white',
          )}
        >
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8 pt-2 lg:p-10 lg:pt-4">
        <h2
          className={cn(
            'text-2xl font-bold leading-tight sm:text-3xl',
            isDark ? 'text-white' : 'text-secondary',
          )}
        >
          {title}
        </h2>

        <p
          className={cn(
            'mt-4 max-w-md text-md leading-relaxed',
            isDark ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>

        <ul className="mt-7 space-y-3.5">
          {points.map((point) => (
            <li
              key={point}
              className={cn(
                'flex items-center gap-3 text-base',
                isDark ? 'text-white/85' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  isDark ? 'bg-white/15 text-accent-soft' : 'bg-primary-soft text-primary',
                )}
              >
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              {point}
            </li>
          ))}
        </ul>

        {/* mt-auto pins the actions to the bottom so both cards align on the
            baseline even though one has two buttons and the other has one. */}
        <div className="mt-auto flex flex-wrap gap-3 pt-9">{actions}</div>
      </div>
    </article>
  );
}
