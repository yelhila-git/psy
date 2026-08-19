'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  Landmark,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { PaymentWithParties } from '@/types';
import { paymentService } from '@/lib/services';
import { TRANSFER_METHOD_LABELS } from '@/lib/constants';
import { formatDate, formatPrice, formatTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/feedback';
import { Field, Textarea } from '@/components/ui/input';
import { Separator } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { ProofViewer } from './proof-viewer';

/**
 * The practitioner's confirmation queue.
 *
 * Every card carries what it takes to match a line on a bank statement:
 * amount, reference, when the patient says the money left, and the proof they
 * attached. Confirming is a deliberate act — the platform cannot verify
 * receipt and never pretends to.
 */
export function PaymentConfirmationList({
  payments: initial,
  psychologistId,
}: {
  payments: PaymentWithParties[];
  psychologistId: string;
}) {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState(initial);
  const [rejecting, setRejecting] = React.useState<PaymentWithParties | null>(null);
  const [reason, setReason] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const confirm = async (payment: PaymentWithParties) => {
    setBusyId(payment.id);
    await paymentService.confirm(payment.id, psychologistId);
    setPayments((current) => current.filter((p) => p.id !== payment.id));
    setBusyId(null);
    toast({
      title: 'Paiement confirmé',
      description: `Le rendez-vous de ${payment.patient.fullName} est confirmé et la consultation est débloquée.`,
      variant: 'success',
    });
  };

  const reject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    await paymentService.reject(
      rejecting.id,
      psychologistId,
      reason.trim() || 'Aucun transfert reçu à cette référence.',
    );
    setPayments((current) => current.filter((p) => p.id !== rejecting.id));
    setBusyId(null);
    setRejecting(null);
    setReason('');
    toast({
      title: 'Paiement signalé comme non reçu',
      description: 'Le patient en est informé et peut déclarer à nouveau son transfert.',
      variant: 'warning',
    });
  };

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucun paiement à confirmer"
        description="Les transferts déclarés par vos patients apparaîtront ici. Vérifiez votre compte avant de confirmer une réception."
        action={{ label: 'Mes rendez-vous', href: '/dashboard/psychologist/appointments' }}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 gap-4">
                <Avatar
                  src={payment.patient.avatarUrl}
                  name={payment.patient.fullName}
                  size="lg"
                  square
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-md font-bold text-secondary">
                    {payment.patient.fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{payment.patient.email}</p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-primary" aria-hidden />
                      {formatDate(payment.appointment.startsAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" aria-hidden />
                      {formatTime(payment.appointment.startsAt)} ·{' '}
                      {payment.appointment.durationMinutes} min
                    </span>
                    {payment.method && (
                      <span className="inline-flex items-center gap-1.5">
                        <Landmark className="size-3.5 text-primary" aria-hidden />
                        {TRANSFER_METHOD_LABELS[payment.method]}
                      </span>
                    )}
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Detail label="Montant attendu">
                      <span className="text-md font-bold text-secondary">
                        {formatPrice(payment.amount, payment.currency)}
                      </span>
                    </Detail>
                    <Detail label="Référence">
                      <span className="font-mono text-base font-semibold text-secondary">
                        {payment.reference}
                      </span>
                    </Detail>
                    <Detail label="Transfert déclaré">
                      <span className="text-base font-medium text-secondary">
                        {payment.transferredAt
                          ? `${formatDate(payment.transferredAt)} à ${formatTime(payment.transferredAt)}`
                          : '—'}
                      </span>
                    </Detail>
                  </dl>

                  <div className="mt-4">
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-subtle-foreground">
                      Preuve de paiement
                    </p>
                    {payment.proof ? (
                      <ProofViewer proof={payment.proof} reference={payment.reference} />
                    ) : (
                      <p className="rounded-control bg-surface-alt px-3 py-2.5 text-base text-muted-foreground">
                        Aucune preuve jointe — vérifiez directement sur votre relevé.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 lg:w-52">
                <Button
                  onClick={() => confirm(payment)}
                  loading={busyId === payment.id}
                  disabled={busyId !== null}
                  full
                >
                  <CheckCircle2 />
                  Paiement reçu
                </Button>
                <Button
                  variant="outline-muted"
                  onClick={() => setRejecting(payment)}
                  disabled={busyId !== null}
                  full
                >
                  <XCircle />
                  Paiement non reçu
                </Button>
                <Button variant="ghost" size="sm" full asChild>
                  <Link href="/dashboard/psychologist/messages">Contacter le patient</Link>
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
              Ne confirmez qu’après avoir vu la somme créditée sur votre compte. La confirmation
              débloque immédiatement la consultation vidéo.
            </p>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Signaler un paiement non reçu"
        description="Le rendez-vous repassera en attente de paiement et le patient pourra déclarer à nouveau son transfert."
        footer={
          <>
            <Button variant="outline-muted" onClick={() => setRejecting(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={reject} loading={busyId === rejecting?.id}>
              <XCircle />
              Confirmer le non-reçu
            </Button>
          </>
        }
      >
        <Field
          label="Motif communiqué au patient"
          htmlFor="reject-reason"
          hint="Soyez précis : un montant erroné ou une référence manquante se corrige facilement."
        >
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Aucun transfert reçu à cette référence, montant incomplet…"
            className="min-h-[90px]"
          />
        </Field>
      </Modal>
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-subtle-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
