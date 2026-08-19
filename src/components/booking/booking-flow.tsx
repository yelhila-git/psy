'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Gift, Landmark, User } from 'lucide-react';
import type { Psychologist } from '@/types';
import { appointmentService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { cn, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Textarea } from '@/components/ui/input';
import { Separator } from '@/components/ui/misc';
import { Rating } from '@/components/ui/rating';
import { useToast } from '@/components/ui/toast';
import { BookingCalendar, type BookingSelection } from './booking-calendar';

const STEPS = [
  { id: 1, label: 'Créneau', icon: CalendarDays },
  { id: 2, label: 'Motif', icon: User },
  { id: 3, label: 'Confirmation', icon: Check },
] as const;

/**
 * Booking is deliberately short: pick a slot, say why (optional), confirm.
 *
 * The transfer instructions live on a separate screen, reached once the slot
 * is held: the patient needs a confirmed reference and amount before they open
 * their banking app, and those only exist after the booking is created.
 */
export function BookingFlow({
  psychologist,
  presetStart,
  presetDuration,
}: {
  psychologist: Psychologist;
  presetStart?: string;
  presetDuration?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = React.useState(1);
  const [selection, setSelection] = React.useState<BookingSelection | null>(null);
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  // Whether this pair's free first consultation is still available. Resolved
  // once, from the pair's history, rather than assumed from the price.
  const [isFirst, setIsFirst] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    appointmentService
      .isFirstConsultation(CURRENT_PATIENT_ID, psychologist.id)
      .then((result) => {
        if (!cancelled) setIsFirst(result);
      });
    return () => {
      cancelled = true;
    };
  }, [psychologist.id]);

  // A slot chosen on the profile page arrives as query params — honour it and
  // start the patient one step in.
  React.useEffect(() => {
    if (!presetStart) return;
    const start = new Date(presetStart);
    if (Number.isNaN(start.getTime())) return;
    const duration = presetDuration ?? 60;
    setSelection({
      date: start,
      slot: {
        id: `slot-preset-${start.getTime()}`,
        start: start.toISOString(),
        end: new Date(start.getTime() + duration * 60_000).toISOString(),
        available: true,
      },
      durationMinutes: duration,
      price: Math.round((psychologist.pricePerHour * duration) / 60 / 500) * 500,
    });
    setStep(2);
  }, [presetStart, presetDuration, psychologist.pricePerHour]);

  const confirm = async () => {
    if (!selection) return;
    setSubmitting(true);
    try {
      const appointment = await appointmentService.create({
        patientId: CURRENT_PATIENT_ID,
        psychologistId: psychologist.id,
        startsAt: selection.slot.start,
        durationMinutes: selection.durationMinutes,
        mode: 'video',
        standardPrice: selection.price,
        currency: psychologist.currency,
        reason: reason || undefined,
      });

      // A free session is confirmed on creation, so there is no payment screen
      // to send the patient to.
      router.push(
        appointment.isFree
          ? '/dashboard/patient/appointments'
          : `/payment/${appointment.id}`,
      );
    } catch {
      toast({
        title: 'La réservation a échoué',
        description: 'Ce créneau vient peut-être d’être pris. Choisissez-en un autre.',
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
      <div className="min-w-0">
        <Stepper current={step} />

        <Card className="mt-6 p-6 lg:p-8">
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-secondary">Choisissez votre créneau</h2>
              <p className="mt-1 text-base text-muted-foreground">
                Sélectionnez la durée, la date et l’horaire qui vous conviennent.
              </p>
              <Separator className="my-6" />
              <BookingCalendar psychologist={psychologist} onSelectionChange={setSelection} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-secondary">Motif de la consultation</h2>
              <p className="mt-1 text-base text-muted-foreground">
                Facultatif, mais utile : quelques mots permettent à {psychologist.firstName} de
                préparer la séance.
              </p>
              <Separator className="my-6" />
              <Field
                label="Ce que vous souhaitez aborder"
                htmlFor="reason"
                hint="Visible uniquement par votre psychologue. Vous pourrez en dire plus pendant la séance."
              >
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Par exemple : anxiété au travail depuis quelques mois, difficultés de sommeil…"
                  maxLength={500}
                />
              </Field>
              <p className="mt-1.5 text-end text-xs text-subtle-foreground">{reason.length}/500</p>
            </>
          )}

          {step === 3 && selection && (
            <>
              <h2 className="text-lg font-bold text-secondary">Vérifiez votre réservation</h2>
              <p className="mt-1 text-base text-muted-foreground">
                {isFirst
                  ? 'Votre première consultation avec ce psychologue est offerte : aucun paiement ne vous sera demandé.'
                  : 'À l’étape suivante, vous recevrez les coordonnées du psychologue pour effectuer le transfert instantané. Aucun paiement en ligne, aucune carte bancaire.'}
              </p>
              <Separator className="my-6" />

              <dl className="space-y-4">
                <Row label="Psychologue" value={psychologist.fullName} />
                <Row
                  label="Date"
                  value={new Date(selection.slot.start).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                />
                <Row
                  label="Horaire"
                  value={`${new Date(selection.slot.start).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} — ${new Date(selection.slot.end).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                />
                <Row label="Durée" value={`${selection.durationMinutes} minutes`} />
                <Row label="Format" value="Visioconférence" />
                {reason && <Row label="Motif" value={reason} />}
              </dl>

              <div
                className={cn(
                  'mt-6 rounded-card p-4',
                  isFirst ? 'bg-success-soft' : 'bg-surface-alt',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-md font-semibold text-secondary">
                    {isFirst ? 'Première consultation' : 'Total à régler'}
                  </span>
                  {isFirst ? (
                    <span className="flex items-baseline gap-2">
                      <span className="text-base text-subtle-foreground line-through">
                        {formatPrice(selection.price, psychologist.currency)}
                      </span>
                      <span className="text-xl font-bold text-success">Gratuite</span>
                    </span>
                  ) : (
                    <span className="text-xl font-bold text-secondary">
                      {formatPrice(selection.price, psychologist.currency)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {isFirst
                    ? 'Offerte pour votre première séance avec ce psychologue. Les suivantes seront au tarif habituel.'
                    : 'À transférer directement au psychologue. Annulation gratuite jusqu’à 24 h avant la séance.'}
                </p>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="rtl-flip" />
              Retour
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!selection}>
                Continuer
                <ArrowRight className="rtl-flip" />
              </Button>
            ) : (
              <Button onClick={confirm} loading={submitting} size="lg">
                {isFirst ? <Gift /> : <Landmark />}
                {isFirst ? 'Confirmer ma consultation gratuite' : 'Réserver et effectuer le paiement'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Summary rail */}
      <aside>
        <Card className="sticky top-28 p-6">
          <div className="flex items-center gap-4">
            <Avatar src={psychologist.avatarUrl} name={psychologist.fullName} size="lg" square />
            <div className="min-w-0">
              <p className="truncate text-md font-bold text-secondary">{psychologist.fullName}</p>
              <p className="truncate text-base text-muted-foreground">{psychologist.title}</p>
              <Rating
                value={psychologist.rating}
                count={psychologist.reviewCount}
                size="sm"
                className="mt-1"
              />
            </div>
          </div>

          <Separator className="my-5" />

          {selection ? (
            <dl className="space-y-3">
              <Row
                label="Date"
                value={new Date(selection.slot.start).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                })}
                compact
              />
              <Row
                label="Horaire"
                value={new Date(selection.slot.start).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                compact
              />
              <Row label="Durée" value={`${selection.durationMinutes} min`} compact />
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-secondary">Total</span>
                {isFirst ? (
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs text-subtle-foreground line-through">
                      {formatPrice(selection.price, psychologist.currency)}
                    </span>
                    <span className="text-lg font-bold text-success">Gratuite</span>
                  </span>
                ) : (
                  <span className="text-lg font-bold text-secondary">
                    {formatPrice(selection.price, psychologist.currency)}
                  </span>
                )}
              </div>
            </dl>
          ) : (
            <p className="text-base text-muted-foreground">
              Sélectionnez un créneau pour voir le récapitulatif.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {isFirst && (
              <Badge variant="success" size="sm">
                <Gift aria-hidden />
                1re consultation offerte
              </Badge>
            )}
            <Badge variant="success" size="sm">
              Annulation gratuite 24 h
            </Badge>
            <Badge variant="primary" size="sm">
              Paiement direct au psychologue
            </Badge>
          </div>
        </Card>
      </aside>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                done
                  ? 'bg-success text-white'
                  : active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-subtle-foreground',
              )}
            >
              {done ? <Check className="size-4" /> : s.id}
            </span>
            <span
              className={cn(
                'hidden text-base font-medium sm:block',
                active ? 'text-secondary' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Row({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-6', compact ? 'items-center' : 'items-start')}>
      <dt className="shrink-0 text-base text-muted-foreground">{label}</dt>
      <dd className="text-end text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}
