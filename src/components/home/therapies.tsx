'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Anchor,
  ArrowRight,
  Baby,
  Brain,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Flame,
  HandHeart,
  Heart,
  HeartPulse,
  Moon,
  Pill,
  Sparkles,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Specialty } from '@/types';
import { SPECIALTIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/feedback';

/**
 * Therapy categories — the entry point most patients actually use. People
 * rarely arrive knowing which practitioner they want; they arrive knowing what
 * they are going through. Each tile links straight into the marketplace with
 * that specialty pre-filtered.
 *
 * Every specialty carries a photograph rather than an icon-on-white treatment:
 * a category people recognise themselves in reads as more human than a pill of
 * text ever does, and it is what actually separates this rail from a plain
 * filter list. Images are graded consistently (slightly desaturated, warmed
 * shadows) so fourteen different stock photos read as one shoot rather than a
 * grab-bag — the same discipline the Figma reference applies to its own
 * photography.
 *
 * The `Specialty` key type means adding a value to SPECIALTIES without
 * describing it here is a compile error, so this cannot silently drift.
 */
const CATEGORY_META: Record<Specialty, { icon: LucideIcon; description: string; image: string }> = {
  anxiety: {
    icon: HeartPulse,
    description: 'Angoisses, crises de panique, anxiété sociale ou généralisée.',
    image: 'photo-1517841905240-472988babdf9',
  },
  stress: {
    icon: Flame,
    description: 'Surcharge mentale, épuisement, burn-out professionnel.',
    image: 'photo-1499209974431-9dddcece7f88',
  },
  depression: {
    icon: CloudRain,
    description: 'Perte d’élan, tristesse durable, épisodes dépressifs.',
    image: 'photo-1517971071642-34a2d3ecc9cd',
  },
  couple: {
    icon: Heart,
    description: 'Communication, crises de couple, séparation.',
    image: 'photo-1516589178581-6cd7833ae3b2',
  },
  family: {
    icon: Users,
    description: 'Conflits familiaux, parentalité, recomposition.',
    image: 'photo-1511895426328-dc8714191300',
  },
  child: {
    icon: Baby,
    description: 'Troubles de l’apprentissage, comportement, accompagnement parental.',
    image: 'photo-1502086223501-7ea6ecd79368',
  },
  adolescent: {
    icon: UsersRound,
    description: 'Harcèlement scolaire, mal-être, orientation.',
    image: 'photo-1531482615713-2afd69097998',
  },
  trauma: {
    icon: Anchor,
    description: 'Événements traumatiques, TSPT, thérapie EMDR.',
    image: 'photo-1508672019048-805c876b67e2',
  },
  sleep: {
    icon: Moon,
    description: 'Insomnies, réveils nocturnes, hygiène du sommeil.',
    image: 'photo-1520206183501-b80df61043c2',
  },
  'self-esteem': {
    icon: Sparkles,
    description: 'Confiance en soi, affirmation, transitions de vie.',
    image: 'photo-1522075469751-3a6694fb2f61',
  },
  work: {
    icon: Briefcase,
    description: 'Souffrance au travail, conflits, reconversion.',
    image: 'photo-1521737604893-d14cc237f11d',
  },
  grief: {
    icon: HandHeart,
    description: 'Deuil, rupture, accompagnement de fin de vie.',
    image: 'photo-1476234251651-f353703a034d',
  },
  addiction: {
    icon: Pill,
    description: 'Dépendances, prévention de la rechute.',
    image: 'photo-1544027993-37dbfe43562a',
  },
  eating: {
    icon: Brain,
    description: 'Rapport à l’alimentation et au corps.',
    image: 'photo-1490645935967-10de6ba17061',
  },
};

function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/${id}?q=80&w=${width}&auto=format&fit=crop`;
}

/** Display order — the most common motifs lead the rail. */
const ORDER: Specialty[] = [
  'anxiety',
  'stress',
  'depression',
  'couple',
  'family',
  'child',
  'adolescent',
  'trauma',
  'sleep',
  'self-esteem',
  'work',
  'grief',
  'addiction',
  'eating',
];

const CARD_WIDTH =
  'w-[46%] flex-none xs:w-[38%] sm:w-[28%] lg:w-[19%] xl:w-[15%]';
const CARD_SIZES = '(min-width:1280px) 15vw, (min-width:1024px) 19vw, (min-width:640px) 28vw, (min-width:390px) 38vw, 46vw';
const AUTOPLAY_INTERVAL_MS = 4000;

/**
 * Settles the rail on the nearest card after a manual drag.
 *
 * `scroll-snap-type: mandatory` normally handles this, but browsers only
 * evaluate snap points on user scroll gestures (wheel, touch, keyboard) — not
 * on a raw `scrollLeft` assignment, which is how the drag above moves the
 * rail. Without this the rail would drop mid-card wherever the drag ended.
 * Viewport rects (not `offsetLeft`) are used so the maths hold regardless of
 * which ancestor happens to establish the positioning context.
 */
function snapToNearestCard(rail: HTMLUListElement) {
  const items = Array.from(rail.children) as HTMLElement[];
  if (!items.length) return;

  const railLeft = rail.getBoundingClientRect().left;
  let nearest = items[0]!;
  let nearestDistance = Infinity;

  for (const item of items) {
    const distance = Math.abs(item.getBoundingClientRect().left - railLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = item;
    }
  }

  const delta = nearest.getBoundingClientRect().left - railLeft;
  rail.scrollTo({ left: rail.scrollLeft + delta, behavior: 'smooth' });
}

export function Therapies({ counts }: { counts: Partial<Record<Specialty, number>> }) {
  const railRef = React.useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  /**
   * Scroll position drives the arrow disabled states.
   *
   * `scrollLeft` is direction-dependent: under `dir="rtl"` browsers report it
   * as 0 at the start and increasingly negative toward the end. Taking the
   * absolute value makes both directions behave identically here.
   */
  const syncScrollState = React.useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const offset = Math.abs(rail.scrollLeft);
    const maxScroll = rail.scrollWidth - rail.clientWidth;

    setAtStart(offset <= 2);
    setAtEnd(offset >= maxScroll - 2);
  }, []);

  React.useEffect(() => {
    syncScrollState();
    const rail = railRef.current;
    if (!rail) return;

    rail.addEventListener('scroll', syncScrollState, { passive: true });
    // Card widths are percentage-based, so a viewport resize changes what fits.
    const observer = new ResizeObserver(syncScrollState);
    observer.observe(rail);

    return () => {
      rail.removeEventListener('scroll', syncScrollState);
      observer.disconnect();
    };
  }, [syncScrollState]);

  /**
   * Click-and-drag with a mouse.
   *
   * `overflow-x-auto` already gives touch and trackpad users native scrolling
   * for free, but a mouse has no scroll gesture over a horizontal rail unless
   * we implement one — this is that implementation. Touch and pen are left
   * alone entirely (`pointerType !== 'mouse'` bails out immediately) so their
   * native momentum and snap behaviour is never overridden by our 1:1 delta.
   *
   * `moved` distinguishes a drag from a plain click: browsers still fire a
   * `click` after pointerup even when the cursor travelled, so without this a
   * drag-to-reorder-view would also navigate to whatever card the drag ended
   * over.
   */
  const drag = React.useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    const rail = railRef.current;
    if (!rail || e.pointerType !== 'mouse') return;

    drag.current = { active: true, startX: e.clientX, startScrollLeft: rail.scrollLeft, moved: false };
    rail.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const rail = railRef.current;
    const state = drag.current;
    if (!rail || !state.active) return;

    const delta = e.clientX - state.startX;
    if (Math.abs(delta) > 4) state.moved = true;
    rail.scrollLeft = state.startScrollLeft - delta;
  };

  const endDrag = (e: React.PointerEvent<HTMLUListElement>) => {
    const rail = railRef.current;
    const state = drag.current;

    if (rail && state.active) {
      try {
        rail.releasePointerCapture(e.pointerId);
      } catch {
        // Capture may already have been released by the browser; nothing to do.
      }
      if (state.moved) snapToNearestCard(rail);
    }
    state.active = false;
  };

  /** Swallows the synthetic click a browser fires after a drag ends over a link. */
  const onClickCapture = (e: React.MouseEvent<HTMLUListElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const scrollByPage = React.useCallback((direction: 'prev' | 'next') => {
    const rail = railRef.current;
    if (!rail) return;

    // One "page" is whatever is currently visible, minus a card of overlap so
    // the user keeps a visual anchor between pages.
    const page = Math.max(240, rail.clientWidth * 0.85);
    const isRTL = getComputedStyle(rail).direction === 'rtl';
    const forward = direction === 'next';
    const sign = forward === isRTL ? -1 : 1;

    rail.scrollBy({ left: page * sign, behavior: 'smooth' });
  }, []);

  /**
   * Autoplay.
   *
   * Pauses for every reason WCAG 2.2.2 (Pause, Stop, Hide) cares about on an
   * auto-advancing carousel: the pointer is over it, keyboard focus is inside
   * it, the tab isn't visible, or the visitor asked the OS for reduced motion
   * — in which case autoplay never starts at all rather than starting and
   * immediately pausing. A manual drag is checked inside the tick itself
   * (via the `drag` ref) rather than as reactive state, since touch users
   * scrolling by hand have no "hover" state to pause on otherwise.
   */
  const [hovering, setHovering] = React.useState(false);
  const [focusedWithin, setFocusedWithin] = React.useState(false);
  const [tabHidden, setTabHidden] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [restartTick, setRestartTick] = React.useState(0);

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  React.useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const autoplayPaused = hovering || focusedWithin || tabHidden || reducedMotion;

  React.useEffect(() => {
    if (autoplayPaused) return;

    const id = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail || drag.current.active) return;

      const offset = Math.abs(rail.scrollLeft);
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 0) return;

      // Loop back to the first card once the rail runs out of room, rather
      // than sitting idle at the end until someone scrolls it back manually.
      if (offset >= maxScroll - 4) {
        rail.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollByPage('next');
      }
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(id);
    // `restartTick` deliberately re-arms the timer after a manual arrow click
    // so autoplay doesn't advance again a moment later and read as a glitchy
    // double-jump.
  }, [autoplayPaused, scrollByPage, restartTick]);

  const handleArrow = (direction: 'prev' | 'next') => {
    scrollByPage(direction);
    setRestartTick((t) => t + 1);
  };

  const onBlurCapture = (e: React.FocusEvent<HTMLUListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusedWithin(false);
    }
  };

  return (
    <section className="bg-background py-section-sm lg:py-section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Nos thérapies"
          title="Par quoi souhaitez-vous commencer ?"
          description="Choisissez ce que vous traversez — nous vous montrons les psychologues spécialisés dans ce motif, disponibles cette semaine."
          action={
            <div className="flex items-center gap-3">
              {/* Arrows are a convenience: the rail is swipeable and every tile
                  is a focusable link, so keyboard and touch work without them. */}
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="outline-muted"
                  size="icon-sm"
                  onClick={() => handleArrow('prev')}
                  disabled={atStart}
                  aria-label="Motifs précédents"
                >
                  <ChevronLeft className="rtl-flip" />
                </Button>
                <Button
                  variant="outline-muted"
                  size="icon-sm"
                  onClick={() => handleArrow('next')}
                  disabled={atEnd}
                  aria-label="Motifs suivants"
                >
                  <ChevronRight className="rtl-flip" />
                </Button>
              </div>

              <Button variant="outline" asChild>
                <Link href="/psychologists">
                  Tous les motifs
                  <ArrowRight className="rtl-flip" />
                </Link>
              </Button>
            </div>
          }
        />

        <div className="relative mt-12">
          <ul
            ref={railRef}
            role="region"
            aria-label="Motifs de consultation"
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            onClickCapture={onClickCapture}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocusCapture={() => setFocusedWithin(true)}
            onBlurCapture={onBlurCapture}
            // `<a>` and `<img>` are natively draggable in every browser (that is
            // how you drag a link to a bookmark bar or an image to the desktop).
            // Left unblocked, a mouse-down-and-move over a card starts the
            // browser's own drag-and-drop gesture instead of ours, which
            // swallows the pointermove events our custom scroll relies on —
            // exactly the "only the arrows work" symptom. Cancelling dragstart
            // here (it bubbles from every card) hands the gesture back to us.
            onDragStart={(e) => e.preventDefault()}
            className={cn(
              'no-scrollbar flex cursor-grab select-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth active:cursor-grabbing',
              // Room for the hover lift and the focus ring, which would
              // otherwise be clipped by the scroll container.
              '-my-2 py-2',
            )}
          >
            {ORDER.map((value, index) => {
              const meta = CATEGORY_META[value];
              const label = SPECIALTIES.find((s) => s.value === value)?.label ?? value;
              const count = counts[value] ?? 0;
              const Icon = meta.icon;

              return (
                <li key={value} className={cn('snap-start', CARD_WIDTH)}>
                  <Link
                    href={`/psychologists?specialty=${value}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Image
                      src={unsplash(meta.image, 480)}
                      alt=""
                      fill
                      draggable={false}
                      sizes={CARD_SIZES}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      className="pointer-events-none select-none object-cover object-center saturate-[0.85] contrast-[1.05] transition-transform duration-500 ease-out group-hover:scale-110"
                    />

                    {/* Duotone scrim: keeps the label legible over any photo and
                        is what makes fourteen different sources feel like one
                        cohesive, graded set rather than assorted stock photos. */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/35 to-secondary/5 transition-opacity duration-300 group-hover:from-secondary/95 group-hover:via-secondary/60"
                      aria-hidden
                    />

                    {/* Icon badge */}
                    <span className="absolute start-3.5 top-3.5 flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary group-hover:border-primary">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>

                    {/* Label block — description and CTA reveal on hover/focus,
                        the category name and count stay visible at rest. */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                      <p
                        className={cn(
                          'text-xs leading-snug text-white/85 opacity-0 transition-all duration-300',
                          'line-clamp-2 -translate-y-1',
                          'group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100',
                        )}
                      >
                        {meta.description}
                      </p>

                      <h3 className="text-md font-bold leading-tight text-white">{label}</h3>

                      <div className="flex items-center justify-between">
                        <span className="text-2xs text-white/70">
                          {count} psychologue{count > 1 ? 's' : ''}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-2xs font-semibold text-white opacity-0 transition-all duration-300',
                            'translate-x-1 rtl:-translate-x-1',
                            'group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
                          )}
                        >
                          Consulter
                          <ArrowRight className="size-3 rtl-flip" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Edge fade hinting at more content. Pointer-events-none so it never
              intercepts a click on the tile underneath. */}
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 end-0 hidden w-16 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 rtl:bg-gradient-to-r sm:block',
              atEnd ? 'opacity-0' : 'opacity-100',
            )}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
