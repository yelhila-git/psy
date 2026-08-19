import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarCheck, Lock, Mic, ShieldCheck, Video } from 'lucide-react';
import type { Psychologist } from '@/types';
import { Button } from '@/components/ui/button';
import { AvatarGroup } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';

/**
 * Hero. Follows the Figma's split rhythm — left column carries the message and
 * both CTAs, right column carries a single premium visual.
 *
 * The visual is composed rather than photographic: a live-consultation frame
 * with floating proof chips. It renders identically offline and scales down to
 * a purpose-built mobile arrangement instead of shrinking.
 */
export function Hero({ practitioners }: { practitioners: Psychologist[] }) {
  const featured = practitioners[0];

  return (
    <section className="relative overflow-hidden bg-surface-alt wash-mint">
      {/* Soft mint band behind the visual, echoing the Figma hero backdrop. */}
      <div
        className="pointer-events-none absolute inset-y-0 end-0 hidden w-1/2 bg-surface/70 lg:block"
        aria-hidden
      />

      <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        {/* ---------------------------------------------------------------- */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            Psychologues diplômés et vérifiés un par un
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.08] text-secondary sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Trouvez le psychologue qui vous correspond
          </h1>

          <p className="mt-5 text-md leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
            Consultez en visioconférence depuis chez vous, à l’heure qui vous arrange. Choisissez
            votre praticien selon sa spécialité, sa langue et son approche — la première séance
            suffit souvent à savoir si le courant passe.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/psychologists">
                Trouver un psychologue
                <ArrowRight className="rtl-flip" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register/psychologist">Je suis psychologue</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <AvatarGroup
                people={practitioners.slice(0, 4).map((p) => ({
                  name: p.fullName,
                  avatarUrl: p.avatarUrl,
                }))}
              />
              <div>
                <p className="text-base font-bold text-secondary">+2 400 patients accompagnés</p>
                <Rating value={4.8} size="sm" showValue={false} className="mt-0.5" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-base text-muted-foreground">
              <Lock className="size-4 shrink-0 text-primary" aria-hidden />
              Échanges chiffrés et confidentiels
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Premium visual: a consultation in progress. */}
        <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
          <div className="relative rounded-[20px] border border-border bg-card p-3 shadow-card-hover">
            {/* Practitioner video frame */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-secondary">
              {featured && (
                // Decorative — the practitioner is named in the caption below.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.avatarUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-95"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/10 to-transparent" />

              <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-error/90 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white">
                <span className="size-1.5 rounded-full bg-white" />
                En direct
              </span>

              <span className="absolute end-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-2xs font-medium text-white backdrop-blur">
                32:14
              </span>

              {/* Patient thumbnail */}
              <div className="absolute end-3 bottom-16 h-[68px] w-[52px] overflow-hidden rounded-lg border-2 border-white/70 bg-secondary-hover shadow-lg sm:h-20 sm:w-16">
                {practitioners[3] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={practitioners[3].avatarUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="absolute inset-x-3 bottom-3">
                <p className="text-base font-bold text-white">{featured?.fullName}</p>
                <p className="text-xs text-white/75">{featured?.title}</p>
              </div>
            </div>

            {/* Call controls */}
            <div className="flex items-center justify-center gap-2.5 py-3">
              {[Mic, Video].map((Icon, i) => (
                <span
                  key={i}
                  className="flex size-10 items-center justify-center rounded-full bg-muted text-secondary"
                  aria-hidden
                >
                  <Icon className="size-[18px]" />
                </span>
              ))}
              <span
                className="flex h-10 items-center rounded-full bg-error px-5 text-xs font-semibold text-white"
                aria-hidden
              >
                Terminer
              </span>
            </div>
          </div>

          {/* Floating proof chips */}
          <div className="absolute -start-3 top-1/3 hidden animate-fade-in items-center gap-2.5 rounded-card border border-border bg-card px-3.5 py-2.5 shadow-card sm:flex">
            <span className="flex size-9 items-center justify-center rounded-full bg-success-soft text-success">
              <BadgeCheck className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold leading-tight text-secondary">Profil vérifié</p>
              <p className="text-2xs text-muted-foreground">Diplôme contrôlé</p>
            </div>
          </div>

          <div className="absolute -end-3 -bottom-4 flex animate-fade-in items-center gap-2.5 rounded-card border border-border bg-card px-3.5 py-2.5 shadow-card">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <CalendarCheck className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold leading-tight text-secondary">RDV sous 24 h</p>
              <p className="text-2xs text-muted-foreground">Créneaux le soir et le week-end</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
