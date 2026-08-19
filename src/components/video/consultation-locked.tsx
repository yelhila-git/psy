import * as React from 'react';
import Link from 'next/link';
import { CalendarX2, CheckCircle2, Hourglass, Landmark, Lock, XCircle } from 'lucide-react';
import type { AppointmentWithParties, UserRole } from '@/types';
import type { LockReason } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * The room, closed.
 *
 * Rendered instead of the consultation whenever the payment gate is not
 * satisfied. Each reason gets its own copy and its own way out — telling
 * someone "access denied" minutes before a therapy session, with no next step,
 * is the worst moment to be unhelpful.
 */
export function ConsultationLocked({
  appointment,
  reason,
  viewerRole,
}: {
  appointment: AppointmentWithParties;
  reason: Exclude<LockReason, null>;
  viewerRole: UserRole;
}) {
  const isPatient = viewerRole === 'patient';
  const other = isPatient ? appointment.psychologist.fullName : appointment.patient.fullName;

  const CONTENT: Record<
    Exclude<LockReason, null>,
    { icon: React.ElementType; title: string; body: string }
  > = {
    awaiting_payment: {
      icon: Lock,
      title: 'Consultation verrouillée',
      body: isPatient
        ? `Votre consultation sera accessible dès que ${other} aura confirmé la réception de votre paiement. Effectuez le transfert puis déclarez-le pour lancer la vérification.`
        : `${other} n’a pas encore réglé cette consultation. La salle s’ouvrira dès que vous aurez confirmé la réception du transfert.`,
    },
    awaiting_confirmation: {
      icon: Hourglass,
      title: 'Paiement en attente de confirmation',
      body: isPatient
        ? `Votre paiement est en attente de confirmation par le psychologue. Vous pourrez rejoindre la consultation dès que ${other} aura vérifié la réception du transfert.`
        : `${other} a déclaré avoir effectué le virement. Confirmez la réception pour ouvrir la salle de consultation.`,
    },
    rejected: {
      icon: XCircle,
      title: 'Paiement non reçu',
      body: isPatient
        ? `${other} indique n’avoir reçu aucun transfert pour ce rendez-vous. Vérifiez le montant et la référence, puis déclarez à nouveau votre transfert.`
        : 'Vous avez signalé ce paiement comme non reçu. La salle restera fermée tant que le règlement n’est pas confirmé.',
    },
    expired: {
      icon: CalendarX2,
      title: 'Réservation expirée',
      body: 'Le délai de paiement est écoulé et le créneau a été libéré. Réservez un nouveau rendez-vous pour poursuivre.',
    },
    cancelled: {
      icon: CalendarX2,
      title: 'Rendez-vous annulé',
      body: 'Ce rendez-vous a été annulé. Retrouvez vos autres consultations depuis votre tableau de bord.',
    },
    completed: {
      icon: CheckCircle2,
      title: 'Consultation terminée',
      body: 'Cette séance a déjà eu lieu. Son récapitulatif est disponible dans votre tableau de bord.',
    },
  };

  const { icon: Icon, title, body } = CONTENT[reason];
  const dashboard = isPatient ? '/dashboard/patient/appointments' : '/dashboard/psychologist/appointments';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-white/10 text-white">
          <Icon className="size-9" aria-hidden />
        </span>

        <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-4 text-md leading-relaxed text-white/75">{body}</p>

        <dl className="mt-8 space-y-2.5 rounded-card bg-white/5 p-5 text-start">
          <Row label="Référence" value={appointment.reference} />
          <Row
            label="Horaire"
            value={`${new Date(appointment.startsAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })} à ${new Date(appointment.startsAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`}
          />
          <Row label="Montant" value={formatPrice(appointment.price, appointment.currency)} />
        </dl>

        <div className="mt-8 flex flex-col gap-3">
          {isPatient && (reason === 'awaiting_payment' || reason === 'rejected') && (
            <Button size="lg" variant="onDark" asChild>
              <Link href={`/payment/${appointment.id}`}>
                <Landmark />
                Voir les instructions de paiement
              </Link>
            </Button>
          )}

          {!isPatient && (reason === 'awaiting_confirmation' || reason === 'awaiting_payment') && (
            <Button size="lg" variant="onDark" asChild>
              <Link href="/dashboard/psychologist/payments">Vérifier les paiements</Link>
            </Button>
          )}

          <Button size="lg" variant="onDark-outline" asChild>
            <Link href={dashboard}>Retour au tableau de bord</Link>
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-white/20" aria-hidden />
          <p className="text-xs text-white/50">
            {isPatient
              ? 'AlloMonPsy n’encaisse aucun paiement : le règlement se fait directement au psychologue.'
              : 'La consultation ne s’ouvre qu’une fois le paiement confirmé de votre part.'}
          </p>
          <span className="h-px w-8 bg-white/20" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-base text-white/60">{label}</dt>
      <dd className="text-end text-base font-medium text-white">{value}</dd>
    </div>
  );
}
