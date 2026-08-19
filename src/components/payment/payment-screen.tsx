'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  SearchX,
  TimerOff,
  Video,
} from 'lucide-react';
import type { AppointmentWithParties, PaymentInstructions, PaymentWithParties } from '@/types';
import { appointmentService, paymentService } from '@/lib/services';
import { formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Separator } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { PaymentCountdown } from './payment-countdown';
import { PaymentInstructionsCard } from './payment-instructions';
import { ProofForm, type ProofSubmission } from './proof-form';

/**
 * The patient's payment screen.
 *
 * One route serves the whole lifecycle — instructions, declaration, waiting,
 * confirmed, refused, expired — because the patient returns to the same link
 * from their dashboard at every stage and should always land somewhere that
 * answers "what do I do now?".
 */
export function PaymentScreen({ appointmentId }: { appointmentId: string }) {
  const { toast } = useToast();

  const [appointment, setAppointment] = React.useState<AppointmentWithParties | null>(null);
  const [payment, setPayment] = React.useState<PaymentWithParties | null>(null);
  const [instructions, setInstructions] = React.useState<PaymentInstructions | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const found = await appointmentService.getById(appointmentId);
      if (cancelled) return;
      setAppointment(found);

      if (!found) {
        setLoading(false);
        return;
      }

      // `create` is idempotent — it returns the existing payment when the
      // patient comes back to this screen later.
      const [created, coordinates] = await Promise.all([
        paymentService.create(appointmentId),
        paymentService.instructionsForAppointment(appointmentId),
      ]);
      if (cancelled) return;

      setPayment(created);
      setInstructions(coordinates);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const submitProof = async (submission: ProofSubmission) => {
    if (!payment) return;
    setSubmitting(true);
    const updated = await paymentService.submitProof({ paymentId: payment.id, ...submission });
    setSubmitting(false);

    if (!updated) {
      toast({
        title: 'La déclaration a échoué',
        description: 'Réessayez dans un instant.',
        variant: 'error',
      });
      return;
    }

    setPayment(updated);
    toast({
      title: 'Paiement déclaré',
      description: 'Le psychologue va vérifier la réception du transfert.',
      variant: 'success',
    });
  };

  // The countdown reaching zero must flip the screen without a reload.
  const handleExpiry = React.useCallback(async () => {
    const refreshed = await paymentService.getByAppointment(appointmentId);
    setPayment(refreshed);
  }, [appointmentId]);

  if (loading) return <PaymentSkeleton />;

  if (!appointment || !payment) {
    return (
      <EmptyState
        icon={SearchX}
        title="Réservation introuvable"
        description="Ce rendez-vous n’existe pas ou la session a expiré. Reprenez la réservation depuis le profil du praticien."
        action={{ label: 'Choisir un psychologue', href: '/psychologists' }}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
      <div className="min-w-0 space-y-6">
        {payment.status === 'payment_pending' && (
          <PendingState
            payment={payment}
            instructions={instructions}
            appointment={appointment}
            submitting={submitting}
            onSubmit={submitProof}
            onExpire={handleExpiry}
          />
        )}

        {payment.status === 'payment_proof_submitted' && <VerifyingState payment={payment} />}
        {payment.status === 'payment_confirmed' && <ConfirmedState payment={payment} />}
        {payment.status === 'payment_rejected' && (
          <RejectedState
            payment={payment}
            instructions={instructions}
            appointment={appointment}
            submitting={submitting}
            onSubmit={submitProof}
            onExpire={handleExpiry}
          />
        )}
        {payment.status === 'payment_expired' && <ExpiredState appointment={appointment} />}
      </div>

      <BookingSummary appointment={appointment} payment={payment} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle states
// ---------------------------------------------------------------------------

function PendingState({
  payment,
  instructions,
  appointment,
  submitting,
  onSubmit,
  onExpire,
}: {
  payment: PaymentWithParties;
  instructions: PaymentInstructions | null;
  appointment: AppointmentWithParties;
  submitting: boolean;
  onSubmit: (submission: ProofSubmission) => void;
  onExpire: () => void;
}) {
  if (!instructions) return <MissingInstructions appointment={appointment} />;

  return (
    <>
      <Card className="border-warning/40 bg-warning-soft/40 p-5">
        <p className="text-base font-semibold text-secondary">
          Votre rendez-vous est réservé temporairement.
        </p>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          Effectuez le transfert de {formatPrice(payment.amount, payment.currency)} au psychologue,
          puis confirmez votre paiement ci-dessous.
        </p>
        <PaymentCountdown expiresAt={payment.expiresAt} onExpire={onExpire} className="mt-3" />
      </Card>

      <Card className="p-6 lg:p-8">
        <PaymentInstructionsCard
          instructions={instructions}
          amount={payment.amount}
          currency={payment.currency}
          reference={payment.reference}
          psychologistName={payment.psychologist.fullName}
        />
      </Card>

      <Card className="p-6 lg:p-8">
        <h2 className="text-lg font-bold text-secondary">Confirmer votre paiement</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Une fois le transfert effectué, indiquez-le ici pour prévenir le psychologue.
        </p>
        <Separator className="my-6" />
        <ProofForm submitting={submitting} onSubmit={onSubmit} />
      </Card>
    </>
  );
}

function RejectedState({
  payment,
  instructions,
  appointment,
  submitting,
  onSubmit,
  onExpire,
}: {
  payment: PaymentWithParties;
  instructions: PaymentInstructions | null;
  appointment: AppointmentWithParties;
  submitting: boolean;
  onSubmit: (submission: ProofSubmission) => void;
  onExpire: () => void;
}) {
  return (
    <>
      <Card className="border-error/40 bg-error-soft/40 p-5">
        <p className="flex items-center gap-2 text-base font-semibold text-error">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Le psychologue n’a pas reçu votre paiement
        </p>
        {payment.rejectionReason && (
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            <span className="font-medium text-secondary">Motif : </span>
            {payment.rejectionReason}
          </p>
        )}
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Vérifiez que le montant et la référence correspondent, puis déclarez à nouveau votre
          transfert. Contactez le psychologue par message en cas de doute.
        </p>
      </Card>

      <PendingState
        payment={payment}
        instructions={instructions}
        appointment={appointment}
        submitting={submitting}
        onSubmit={onSubmit}
        onExpire={onExpire}
      />
    </>
  );
}

function VerifyingState({ payment }: { payment: PaymentWithParties }) {
  return (
    <Card className="p-6 text-center lg:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-info-soft text-secondary">
        <Hourglass className="size-7" aria-hidden />
      </span>

      <h2 className="mt-5 text-2xl font-bold text-secondary">Paiement en cours de vérification</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        {payment.psychologist.fullName} a été prévenu et va vérifier la réception de votre transfert.
        Vous recevrez une notification dès que votre rendez-vous sera confirmé.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-card bg-surface-alt p-4 text-start">
        <dl className="space-y-2.5">
          <SummaryRow label="Référence" value={payment.reference} />
          <SummaryRow label="Montant déclaré" value={formatPrice(payment.amount, payment.currency)} />
          {payment.proof && <SummaryRow label="Preuve envoyée" value={payment.proof.fileName} />}
        </dl>
      </div>

      <Button variant="outline-muted" className="mt-6" asChild>
        <Link href="/dashboard/patient/appointments">Voir mes rendez-vous</Link>
      </Button>
    </Card>
  );
}

function ConfirmedState({ payment }: { payment: PaymentWithParties }) {
  return (
    <Card className="p-6 text-center lg:p-10">
      <span className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success/30" aria-hidden />
        <CheckCircle2 className="relative size-8" aria-hidden />
      </span>

      <h2 className="mt-5 text-2xl font-bold text-secondary">Votre paiement a été confirmé</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        {payment.psychologist.fullName} a confirmé la réception de votre paiement. Votre
        consultation est maintenant disponible.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href={`/consultation/${payment.appointmentId}`}>
            <Video />
            Rejoindre la consultation
          </Link>
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/dashboard/patient/appointments">Voir mes rendez-vous</Link>
        </Button>
      </div>
    </Card>
  );
}

function ExpiredState({ appointment }: { appointment: AppointmentWithParties }) {
  return (
    <Card className="p-6 text-center lg:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-subtle-foreground">
        <TimerOff className="size-7" aria-hidden />
      </span>

      <h2 className="mt-5 text-2xl font-bold text-secondary">Réservation expirée</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        Le délai de paiement est écoulé et le créneau a été remis à disposition. Si vous avez tout
        de même effectué le transfert, contactez directement le psychologue.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href={`/booking/${appointment.psychologist.slug}`}>
            <CalendarClock />
            Choisir un nouveau créneau
          </Link>
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/dashboard/patient/messages">Contacter le psychologue</Link>
        </Button>
      </div>
    </Card>
  );
}

/** The practitioner deactivated their coordinates between booking and payment. */
function MissingInstructions({ appointment }: { appointment: AppointmentWithParties }) {
  return (
    <Card className="p-6 lg:p-10">
      <EmptyState
        icon={AlertTriangle}
        title="Coordonnées de paiement indisponibles"
        description={`${appointment.psychologist.fullName} n’a pas de coordonnées de paiement actives pour le moment. Contactez-le par message : votre créneau reste réservé le temps de régulariser.`}
        action={{ label: 'Envoyer un message', href: '/dashboard/patient/messages' }}
        secondaryAction={{ label: 'Voir mes rendez-vous', href: '/dashboard/patient/appointments' }}
        className="border-0 bg-transparent py-0"
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------

function BookingSummary({
  appointment,
  payment,
}: {
  appointment: AppointmentWithParties;
  payment: PaymentWithParties;
}) {
  const start = new Date(appointment.startsAt);

  return (
    <aside>
      <Card className="sticky top-28 p-6">
        <h2 className="text-md font-bold text-secondary">Récapitulatif</h2>

        <div className="mt-5 flex items-center gap-3">
          <Avatar
            src={appointment.psychologist.avatarUrl}
            name={appointment.psychologist.fullName}
            size="default"
            square
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-secondary">
              {appointment.psychologist.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {appointment.psychologist.title}
            </p>
          </div>
        </div>

        <Separator className="my-5" />

        <dl className="space-y-3">
          <SummaryRow
            label="Date"
            value={start.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })}
          />
          <SummaryRow
            label="Horaire"
            value={start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          />
          <SummaryRow label="Durée" value={`${appointment.durationMinutes} min`} />
          <SummaryRow label="Format" value="Visioconférence" />
          <SummaryRow label="Référence" value={payment.reference} />
        </dl>

        <Separator className="my-5" />

        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-secondary">Montant à virer</span>
          <span className="text-xl font-bold text-secondary">
            {formatPrice(payment.amount, payment.currency)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-base text-muted-foreground">Statut du paiement</span>
          <StatusBadge kind="payment" status={payment.status} size="sm" />
        </div>

        <Badge variant="secondary" size="sm" className="mt-5">
          Paiement direct au psychologue
        </Badge>
      </Card>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-base text-muted-foreground">{label}</dt>
      <dd className="break-all text-end text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}

function PaymentSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="space-y-3 p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
        <Card className="space-y-4 p-8">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </Card>
      </div>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
