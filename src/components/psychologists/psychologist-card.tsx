'use client';

import Link from 'next/link';
import { Gift, Globe2, Heart, Video } from 'lucide-react';
import type { Psychologist } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { LANGUAGES, SPECIALTIES } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';

const specialtyLabel = (value: string) => SPECIALTIES.find((s) => s.value === value)?.label ?? value;
const languageLabel = (value: string) => LANGUAGES.find((l) => l.value === value)?.label ?? value;

/** "Disponible aujourd'hui" / "Disponible demain" / "Dès le 14 août" */
function availabilityLabel(nextAvailableAt?: string) {
  if (!nextAvailableAt) return null;

  const next = new Date(nextAvailableAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);

  if (days <= 0) return { text: "Disponible aujourd'hui", soon: true };
  if (days === 1) return { text: 'Disponible demain', soon: true };
  if (days <= 7)
    return { text: `Dès ${next.toLocaleDateString('fr-FR', { weekday: 'long' })}`, soon: false };
  return {
    text: `Dès le ${next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
    soon: false,
  };
}

export interface PsychologistCardProps {
  psychologist: Psychologist;
  /** `grid` for the marketplace/homepage; `row` for dense list views. */
  layout?: 'grid' | 'row';
  /** The viewer still has their free first session with this practitioner. */
  firstConsultationFree?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  className?: string;
}

/**
 * Practitioner card.
 *
 * The hierarchy is deliberately short — photo, name, credential, when they are
 * free, what they treat, what it costs. Experience, rating and review counts
 * were removed: stacking multiple numeric signals made the card read like a
 * directory listing rather than a considered profile. Trust is instead carried
 * by the verified badge and the specialty match.
 */
export function PsychologistCard({
  psychologist: p,
  layout = 'grid',
  firstConsultationFree,
  isFavorite,
  onToggleFavorite,
  className,
}: PsychologistCardProps) {
  const availability = availabilityLabel(p.nextAvailableAt);
  const profileHref = `/psychologists/${p.slug}`;
  const isRow = layout === 'row';

  return (
    <Card
      interactive
      className={cn(
        'group relative flex overflow-hidden',
        isRow ? 'flex-col sm:flex-row sm:items-center' : 'flex-col',
        className,
      )}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Identity: photo, name, credential, availability                   */}
      <div className={cn('flex items-start gap-4 p-6', isRow && 'sm:flex-1 sm:pe-0')}>
        <div className="relative shrink-0">
          <Avatar src={p.avatarUrl} name={p.fullName} size="xl" square />
          {p.isVerified && (
            <span
              className="absolute -bottom-1.5 -end-1.5 rounded-full bg-card p-0.5"
              title="Praticien vérifié"
            >
              <VerifiedBadge showLabel={false} size="sm" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-md font-bold leading-snug text-secondary transition-colors group-hover:text-primary">
                <Link href={profileHref} className="after:absolute after:inset-0 after:content-['']">
                  {p.fullName}
                </Link>
              </h3>
              <p className="mt-1 truncate text-base text-muted-foreground">{p.title}</p>
            </div>

            {/* Consultation format, aligned with the photo. Icon-only keeps the
                header uncluttered; the label is exposed to assistive tech. */}
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
              title="Consultation en visioconférence"
            >
              <Video className="size-4" aria-hidden />
              <span className="sr-only">Consultation en visioconférence</span>
            </span>
          </div>

          {/* Availability takes the slot the rating used to occupy: it keeps the
              header aligned with the photo, and it is the signal that actually
              drives a booking. */}
          {availability && (
            <p
              className={cn(
                'mt-2.5 flex items-center gap-2 text-xs',
                availability.soon ? 'font-medium text-success' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  availability.soon ? 'bg-success' : 'bg-subtle-foreground',
                )}
                aria-hidden
              />
              {availability.text}
            </p>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* What they treat, languages                                        */}
      <div className={cn('flex flex-1 flex-col px-6 pb-6', isRow && 'sm:px-6 sm:py-6')}>
        {/* One line only: enough to tell two practitioners apart without
            turning the card into a paragraph. */}
        <p className="mb-3 line-clamp-1 text-base text-muted-foreground">{p.headline}</p>

        <div className="flex flex-wrap gap-1.5">
          {p.specialties.slice(0, 2).map((s) => (
            <Badge key={s} variant="primary" size="sm">
              {specialtyLabel(s)}
            </Badge>
          ))}
          {p.specialties.length > 2 && (
            <Badge variant="outline" size="sm">
              +{p.specialties.length - 2}
            </Badge>
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Globe2 className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
          <span className="truncate">{p.languages.map(languageLabel).join(' · ')}</span>
        </p>

        {/* -------------------------------------------------------------- */}
        {/* Price and actions                                               */}
        <div
          className={cn(
            'mt-5 flex items-center justify-between gap-4 border-t border-border pt-4',
            isRow && 'sm:mt-auto',
          )}
        >
          <div>
            {firstConsultationFree ? (
              <>
                <p className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-success">
                  <Gift className="size-3" aria-hidden />
                  1re consultation
                </p>
                <p className="text-lg font-bold leading-tight text-success">
                  Gratuite{' '}
                  <span className="text-xs font-normal text-subtle-foreground line-through">
                    {formatPrice(p.pricePerHour, p.currency)}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-2xs uppercase tracking-wide text-subtle-foreground">
                  À partir de
                </p>
                <p className="text-lg font-bold leading-tight text-secondary">
                  {formatPrice(p.pricePerHour, p.currency)}
                </p>
              </>
            )}
          </div>

          {/* Sits above the card-wide link overlay so both actions stay clickable. */}
          <div className="relative z-10 flex items-center gap-2">
            <Button variant="outline-muted" size="sm" asChild>
              <Link href={profileHref}>Profil</Link>
            </Button>
            {p.acceptsNewPatients ? (
              <Button size="sm" asChild>
                <Link href={`/booking/${p.slug}`}>Réserver</Link>
              </Button>
            ) : (
              <Button size="sm" disabled title="Ce praticien n’accepte pas de nouveaux patients">
                Complet
              </Button>
            )}
          </div>
        </div>
      </div>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(p.id)}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className="absolute end-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-card/90 text-subtle-foreground shadow-soft backdrop-blur transition-colors hover:text-error"
        >
          <Heart className={cn('size-4', isFavorite && 'fill-error text-error')} />
        </button>
      )}
    </Card>
  );
}

/** Loading placeholder that mirrors the card's real dimensions. */
export function PsychologistCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'row' }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', layout === 'row' && 'sm:flex-row')}>
      <div className="flex items-start gap-4 p-6">
        <Skeleton className="size-20 rounded-card" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="size-9 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-6">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    </Card>
  );
}
