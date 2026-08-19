'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarOff, CalendarX2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Psychologist, TimeSlot as TimeSlotType } from '@/types';
import { psychologistService } from '@/lib/services';
import { CONSULTATION_DURATIONS } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';

/** A single bookable time. Disabled slots stay visible so the day reads as full. */
export function TimeSlot({
  slot,
  selected,
  onSelect,
}: {
  slot: TimeSlotType;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = new Date(slot.start).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!slot.available}
      aria-pressed={selected}
      className={cn(
        'rounded-control border py-2.5 text-base font-medium transition-all',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : slot.available
            ? 'border-border bg-background text-secondary hover:border-primary hover:text-primary'
            : 'cursor-not-allowed border-border/60 bg-muted text-subtle-foreground line-through',
      )}
    >
      {label}
    </button>
  );
}

export interface BookingSelection {
  date: Date;
  slot: TimeSlotType;
  durationMinutes: number;
  price: number;
}

/** Price scales with duration off the practitioner's hourly rate, rounded to 5 MAD. */
export function priceFor(psychologist: Psychologist, durationMinutes: number) {
  return Math.round((psychologist.pricePerHour * durationMinutes) / 60 / 500) * 500;
}

export function BookingCalendar({
  psychologist,
  onSelectionChange,
  daysToShow = 14,
  className,
}: {
  psychologist: Psychologist;
  onSelectionChange?: (selection: BookingSelection | null) => void;
  daysToShow?: number;
  className?: string;
}) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [duration, setDuration] = React.useState<number>(60);
  const [slots, setSlots] = React.useState<TimeSlotType[] | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlotType | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // The visible date strip, one week at a time.
  const days = React.useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // Default to the first day the practitioner actually works.
  React.useEffect(() => {
    if (selectedDate) return;
    const firstOpen = days.find((d) => psychologist.availability.find((a) => a.weekday === d.getDay())?.enabled);
    if (firstOpen) setSelectedDate(firstOpen);
  }, [days, psychologist.availability, selectedDate]);

  // Load slots whenever the day or the duration changes.
  React.useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;

    setLoadingSlots(true);
    setSelectedSlot(null);
    onSelectionChange?.(null);

    psychologistService.slotsForDate(psychologist.id, selectedDate, duration).then((data) => {
      if (!cancelled) {
        setSlots(data);
        setLoadingSlots(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // onSelectionChange is intentionally excluded: callers commonly pass an
    // inline function, which would re-trigger the fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psychologist.id, selectedDate, duration]);

  const price = priceFor(psychologist, duration);

  const selectSlot = (slot: TimeSlotType) => {
    setSelectedSlot(slot);
    if (selectedDate) {
      onSelectionChange?.({ date: selectedDate, slot, durationMinutes: duration, price });
    }
  };

  const availableCount = slots?.filter((s) => s.available).length ?? 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* --- Duration ------------------------------------------------------ */}
      <div>
        <p className="mb-2.5 text-base font-semibold text-secondary">Durée de la séance</p>
        <div className="grid grid-cols-4 gap-2">
          {CONSULTATION_DURATIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDuration(value)}
              aria-pressed={duration === value}
              className={cn(
                'rounded-control border py-2 text-base font-medium transition-all',
                duration === value
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
              )}
            >
              {value} min
            </button>
          ))}
        </div>
      </div>

      {/* --- Date strip ---------------------------------------------------- */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-base font-semibold text-secondary">Choisissez une date</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="rounded-control p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="size-4 rtl-flip" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => Math.min(Math.floor(daysToShow / 7), w + 1))}
              disabled={weekOffset >= Math.floor(daysToShow / 7)}
              className="rounded-control p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="size-4 rtl-flip" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const rule = psychologist.availability.find((a) => a.weekday === day.getDay());
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = day < today;
            const closed = !rule?.enabled || isPast;
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            const isToday = day.toDateString() === today.toDateString();

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={closed}
                onClick={() => setSelectedDate(day)}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center rounded-control border py-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : closed
                      ? 'cursor-not-allowed border-transparent bg-muted/60 text-subtle-foreground'
                      : 'border-border text-secondary hover:border-primary hover:text-primary',
                )}
              >
                <span className="text-2xs uppercase opacity-80">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span className="text-md font-bold leading-tight">{day.getDate()}</span>
                {isToday && !isSelected && (
                  <span className="mt-0.5 size-1 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Slots --------------------------------------------------------- */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-base font-semibold text-secondary">Choisissez un horaire</p>
          {!loadingSlots && slots && availableCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {availableCount} créneau{availableCount > 1 ? 'x' : ''} libre
              {availableCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingSlots ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !slots?.length ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-muted/40 px-4 py-8 text-center">
            <CalendarX2 className="size-6 text-subtle-foreground" aria-hidden />
            <p className="text-base font-medium text-secondary">Aucun créneau ce jour</p>
            <p className="text-xs text-muted-foreground">
              {psychologist.firstName} ne consulte pas à cette date. Essayez un autre jour.
            </p>
          </div>
        ) : availableCount === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-warning/40 bg-warning-soft px-4 py-8 text-center">
            <CalendarX2 className="size-6 text-warning" aria-hidden />
            <p className="text-base font-medium text-secondary">Journée complète</p>
            <p className="text-xs text-muted-foreground">
              Tous les créneaux sont réservés. Sélectionnez une autre date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <TimeSlot
                key={slot.id}
                slot={slot}
                selected={selectedSlot?.id === slot.id}
                onSelect={() => selectSlot(slot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Price summary -------------------------------------------------- */}
      <div className="flex items-center justify-between rounded-card bg-surface-alt px-4 py-3.5">
        <div>
          <p className="text-xs text-muted-foreground">
            Séance de {duration} min en visioconférence
          </p>
          <p className="text-lg font-bold text-secondary">
            {formatPrice(price, psychologist.currency)}
          </p>
        </div>
        {loadingSlots && <Loader2 className="size-4 animate-spin text-primary" aria-hidden />}
      </div>
    </div>
  );
}

/** Full booking panel with the confirm action — used in the profile sidebar. */
export function BookingPanel({
  psychologist,
  acceptsBookings = true,
}: {
  psychologist: Psychologist;
  /** False while the practitioner has published no way to be paid. */
  acceptsBookings?: boolean;
}) {
  const [selection, setSelection] = React.useState<BookingSelection | null>(null);

  const href = selection
    ? `/booking/${psychologist.slug}?start=${encodeURIComponent(selection.slot.start)}&duration=${selection.durationMinutes}`
    : `/booking/${psychologist.slug}`;

  // Booking someone with no payment coordinates strands the patient on a
  // payment screen with nowhere to transfer the money.
  if (!acceptsBookings) {
    return (
      <div className="space-y-4">
        <div className="rounded-card border border-dashed border-border-strong bg-surface-alt p-5 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-warning-soft text-warning">
            <CalendarOff className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-base font-bold text-secondary">Réservation indisponible</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {psychologist.firstName} n’accepte pas de nouvelles réservations pour le moment.
            Consultez les autres praticiens disponibles.
          </p>
        </div>

        <Button size="lg" variant="outline-muted" full asChild>
          <Link href="/psychologists">Voir d’autres psychologues</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BookingCalendar psychologist={psychologist} onSelectionChange={setSelection} />

      {selection ? (
        <Button size="lg" full asChild>
          <Link href={href}>Réserver cette consultation</Link>
        </Button>
      ) : (
        <Button size="lg" full disabled>
          Choisissez un créneau
        </Button>
      )}

      <p className="text-center text-xs leading-relaxed text-subtle-foreground">
        Annulation gratuite jusqu’à 24 h avant la séance. Le règlement se fait par transfert instantané
        au psychologue, après la réservation.
      </p>
    </div>
  );
}
