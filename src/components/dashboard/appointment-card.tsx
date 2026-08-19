'use client';

import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Gift,
  Hourglass,
  Landmark,
  Lock,
  MessageSquare,
  MoreVertical,
  Phone,
  Video,
  XCircle,
} from 'lucide-react';
import type { AppointmentWithParties, PaymentStatus, UserRole } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** The join button only unlocks in the 10 minutes before the session starts. */
function isJoinable(startsAt: string, endsAt: string) {
  const now = Date.now();
  return now >= new Date(startsAt).getTime() - 10 * 60_000 && now <= new Date(endsAt).getTime();
}

/**
 * The payment line under a booking.
 *
 * Answers the patient's two live questions at a glance — where the money is,
 * and whether the room will open — without making them open the payment
 * screen to find out.
 */
function PaymentLine({
  status,
  viewerRole,
}: {
  status: PaymentStatus;
  viewerRole: UserRole;
}) {
  const COPY: Record<PaymentStatus, { icon: React.ElementType; label: string; tone: string }> = {
    payment_free: {
      icon: Gift,
      label: 'Première consultation gratuite',
      tone: 'text-success',
    },
    payment_pending: {
      icon: Hourglass,
      label: viewerRole === 'patient' ? 'Paiement en attente' : 'En attente du transfert du patient',
      tone: 'text-warning',
    },
    payment_proof_submitted: {
      icon: Landmark,
      label:
        viewerRole === 'patient'
          ? 'Paiement en cours de vérification'
          : 'Paiement déclaré, à confirmer',
      tone: 'text-secondary',
    },
    payment_confirmed: { icon: CheckCircle2, label: 'Paiement confirmé', tone: 'text-success' },
    payment_rejected: {
      icon: XCircle,
      label: viewerRole === 'patient' ? 'Paiement non reçu par le psychologue' : 'Paiement refusé',
      tone: 'text-error',
    },
    payment_expired: { icon: Lock, label: 'Délai de paiement dépassé', tone: 'text-subtle-foreground' },
  };

  const { icon: Icon, label, tone } = COPY[status];

  return (
    <p className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', tone)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </p>
  );
}

export function AppointmentCard({
  appointment,
  paymentStatus,
  viewerRole,
  onCancel,
  className,
}: {
  appointment: AppointmentWithParties;
  /** Omitted on history screens, where the payment line adds nothing. */
  paymentStatus?: PaymentStatus;
  viewerRole: UserRole;
  onCancel?: (id: string) => void;
  className?: string;
}) {
  // A patient sees their psychologist; a psychologist sees their patient.
  const other =
    viewerRole === 'patient'
      ? {
          name: appointment.psychologist.fullName,
          avatar: appointment.psychologist.avatarUrl,
          subtitle: appointment.psychologist.title,
          href: `/psychologists/${appointment.psychologist.slug}`,
        }
      : {
          name: appointment.patient.fullName,
          avatar: appointment.patient.avatarUrl,
          subtitle: appointment.patient.email,
          href: '/dashboard/psychologist/patients',
        };

  const start = new Date(appointment.startsAt);
  const upcoming = appointment.status === 'confirmed' && start.getTime() > Date.now();
  // A free session has nothing to settle; otherwise the practitioner's
  // confirmation is the gate. Absent on history screens, where the appointment
  // status already tells the whole story.
  const settled = !appointment.paymentRequired || paymentStatus === 'payment_confirmed';
  const joinable = isJoinable(appointment.startsAt, appointment.endsAt) && settled;
  const awaitingPayment =
    appointment.paymentRequired &&
    (appointment.status === 'pending_payment' || appointment.status === 'payment_confirmation');

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar src={other.avatar} name={other.name} size="lg" square />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={other.href}
                className="truncate text-md font-bold text-secondary transition-colors hover:text-primary"
              >
                {other.name}
              </Link>
              <StatusBadge kind="appointment" status={appointment.status} size="sm" />
            </div>

            <p className="mt-0.5 truncate text-base text-muted-foreground">{other.subtitle}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" aria-hidden />
                {start.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" aria-hidden />
                {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                {appointment.durationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1.5">
                {appointment.mode === 'video' ? (
                  <Video className="size-3.5 text-primary" aria-hidden />
                ) : (
                  <Phone className="size-3.5 text-primary" aria-hidden />
                )}
                {appointment.mode === 'video' ? 'Visio' : 'Audio'}
              </span>
              {appointment.isFree ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-success">
                  <Gift className="size-3.5" aria-hidden />
                  Gratuite
                  <span className="font-normal text-subtle-foreground line-through">
                    {formatPrice(appointment.standardPrice, appointment.currency)}
                  </span>
                </span>
              ) : (
                <span className="font-medium text-secondary">
                  {formatPrice(appointment.price, appointment.currency)}
                </span>
              )}
            </div>

            {paymentStatus && <PaymentLine status={paymentStatus} viewerRole={viewerRole} />}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {awaitingPayment &&
            viewerRole === 'patient' &&
            (appointment.status === 'pending_payment' ? (
              <Button size="sm" asChild>
                <Link href={`/payment/${appointment.id}`}>
                  <Landmark />
                  Instructions de paiement
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline-muted" asChild>
                <Link href={`/payment/${appointment.id}`}>Suivre la vérification</Link>
              </Button>
            ))}

          {awaitingPayment && viewerRole === 'psychologist' && (
            <Button size="sm" variant="outline-muted" asChild>
              <Link href="/dashboard/psychologist/payments">Voir le paiement</Link>
            </Button>
          )}

          {upcoming &&
            (joinable ? (
              <Button size="sm" asChild>
                <Link href={`/consultation/${appointment.id}`}>
                  <Video />
                  Rejoindre
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline-muted"
                disabled
                title={
                  settled
                    ? 'La salle ouvre 10 minutes avant la séance'
                    : 'La salle s’ouvre dès que le paiement est confirmé'
                }
              >
                {settled ? <Video /> : <Lock />}
                Rejoindre
              </Button>
            ))}

          {appointment.status === 'completed' && (
            <Button size="sm" variant="outline-muted" asChild>
              <Link
                href={
                  viewerRole === 'patient'
                    ? `/psychologists/${appointment.psychologist.slug}`
                    : '/dashboard/psychologist/patients'
                }
              >
                Revoir
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-control p-2 text-subtle-foreground transition-colors hover:bg-muted hover:text-secondary"
              aria-label="Actions du rendez-vous"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/${viewerRole === 'patient' ? 'patient' : 'psychologist'}/messages`}
                >
                  <MessageSquare />
                  Envoyer un message
                </Link>
              </DropdownMenuItem>
              {upcoming && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => onCancel?.(appointment.id)}>
                    <XCircle />
                    Annuler le rendez-vous
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {appointment.reason && (
        <p className="mt-4 rounded-control bg-muted/60 px-4 py-2.5 text-base text-muted-foreground">
          <span className="font-medium text-secondary">Motif : </span>
          {appointment.reason}
        </p>
      )}
    </Card>
  );
}

/** Prominent "next session" card for the top of a dashboard. */
export function NextAppointmentCard({
  appointment,
  paymentStatus,
  viewerRole,
}: {
  appointment: AppointmentWithParties;
  paymentStatus?: PaymentStatus;
  viewerRole: UserRole;
}) {
  const other =
    viewerRole === 'patient'
      ? { name: appointment.psychologist.fullName, avatar: appointment.psychologist.avatarUrl, subtitle: appointment.psychologist.title }
      : { name: appointment.patient.fullName, avatar: appointment.patient.avatarUrl, subtitle: 'Patient' };

  const start = new Date(appointment.startsAt);
  const settled = !appointment.paymentRequired || paymentStatus === 'payment_confirmed';
  const joinable = isJoinable(appointment.startsAt, appointment.endsAt) && settled;
  const inHours = Math.round((start.getTime() - Date.now()) / 3_600_000);

  return (
    <div className="relative overflow-hidden rounded-card bg-secondary p-6 text-white lg:p-7">
      <div className="pattern-puzzle absolute inset-0 opacity-60" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={other.avatar} name={other.name} size="xl" square className="ring-2 ring-white/30" />
          <div>
            <p className="eyebrow text-accent-soft">Prochaine consultation</p>
            <p className="mt-1.5 text-lg font-bold text-white">{other.name}</p>
            <p className="text-base text-white/70">{other.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div>
            <p className="text-xs text-white/60">Date et heure</p>
            <p className="mt-0.5 text-md font-bold text-white">
              {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-base text-white/75">
              {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
              {appointment.durationMinutes} min
              {inHours > 0 && inHours < 48 && ` · dans ${inHours} h`}
            </p>
          </div>

          {joinable ? (
            <Button variant="onDark" size="lg" asChild>
              <Link href={`/consultation/${appointment.id}`}>
                <Video />
                Rejoindre la séance
              </Link>
            </Button>
          ) : settled ? (
            <Button variant="onDark-outline" size="lg" disabled>
              <Video />
              Accès 10 min avant
            </Button>
          ) : (
            <Button variant="onDark-outline" size="lg" disabled>
              <Lock />
              Paiement à confirmer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
