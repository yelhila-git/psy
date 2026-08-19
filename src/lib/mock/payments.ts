import type { Appointment, Payment, PaymentEvent, PaymentStatus } from '@/types';
import { DEFAULT_TRANSFER_METHOD, PAYMENT_WINDOW_MINUTES } from '@/lib/constants';
import { buildPaymentReference, paymentWindowEnd } from '@/lib/payments';
import { addMinutes, createRng, int, iso } from './seed';
import { appointments } from './appointments';

const PROOF_FILES = [
  'transfert-wafacash.jpg',
  'recu-cashplus.pdf',
  'capture-cih-mobile.png',
  'transfert-barid-cash.jpg',
  'recu-transfert.pdf',
];

/**
 * Maps an appointment's state to the payment state that produced it, so the
 * two never contradict each other in the mock set.
 */
function statusForAppointment(appointment: Appointment, r: () => number): PaymentStatus {
  switch (appointment.status) {
    case 'pending_payment':
      return 'payment_pending';
    case 'payment_confirmation':
      return 'payment_proof_submitted';
    case 'cancelled':
      // Most cancellations are ordinary; a few are transfers that never arrived.
      return r() > 0.7 ? 'payment_expired' : 'payment_rejected';
    default:
      return 'payment_confirmed';
  }
}

/**
 * Payment records exist only for consultations that cost something.
 *
 * A free first consultation has no payment to track; minting a zero-amount
 * record for it would inflate every payment list, funnel tile and report with
 * rows that never involved a transfer.
 */
export const payments: Payment[] = appointments
  .filter((appointment) => appointment.paymentRequired)
  .map((appointment, index) => {
    const r = createRng(6100 + index * 19);
    const status = statusForAppointment(appointment, r);

    // Seeded bookings were "created" days ago, which would put every unpaid one
    // past its deadline — the lazy expiry sweep would cancel the entire
    // pending set on first read. Unpaid demo bookings are therefore anchored to
    // now, so their countdown is genuinely running when the app opens.
    const pending = status === 'payment_pending';
    const expiresAt = pending
      ? new Date(
          Math.min(Date.now() + int(6, 27, r) * 60_000, new Date(appointment.startsAt).getTime()),
        )
      : paymentWindowEnd(appointment.createdAt, appointment.startsAt);
    const createdAt = pending
      ? new Date(expiresAt.getTime() - PAYMENT_WINDOW_MINUTES * 60_000)
      : new Date(appointment.createdAt);

    // The patient rarely transfers the instant they book.
    const submittedAt = addMinutes(createdAt, int(3, 25, r));
    const confirmedAt = addMinutes(submittedAt, int(20, 900, r));

    const declared = status !== 'payment_pending' && status !== 'payment_expired';
    const hasProof = declared && r() > 0.25;

    const events: PaymentEvent[] = [
      {
        id: `evt-${index}-created`,
        at: iso(createdAt),
        actorRole: 'system',
        label: 'Réservation créée, paiement en attente',
      },
    ];

    if (declared) {
      events.push({
        id: `evt-${index}-submitted`,
        at: iso(submittedAt),
        actorRole: 'patient',
        actorId: appointment.patientId,
        label: hasProof
          ? 'Le patient a déclaré le paiement et joint une preuve'
          : 'Le patient a déclaré avoir effectué le paiement',
      });
    }

    if (status === 'payment_confirmed') {
      events.push({
        id: `evt-${index}-confirmed`,
        at: iso(confirmedAt),
        actorRole: 'psychologist',
        actorId: appointment.psychologistId,
        label: 'Le psychologue a confirmé la réception du paiement',
      });
    }

    if (status === 'payment_rejected') {
      events.push({
        id: `evt-${index}-rejected`,
        at: iso(confirmedAt),
        actorRole: 'psychologist',
        actorId: appointment.psychologistId,
        label: 'Le psychologue n’a pas reçu le paiement',
        note: 'Aucun transfert reçu à cette référence.',
      });
    }

    if (status === 'payment_expired') {
      events.push({
        id: `evt-${index}-expired`,
        at: iso(expiresAt),
        actorRole: 'system',
        label: 'Délai de paiement dépassé, créneau libéré',
      });
    }

    return {
      id: `pay-${String(index + 1).padStart(4, '0')}`,
      reference: buildPaymentReference(index + 1, createdAt),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      psychologistId: appointment.psychologistId,
      amount: appointment.price,
      currency: appointment.currency,
      method: declared ? DEFAULT_TRANSFER_METHOD : undefined,
      status,
      proof: hasProof
        ? {
            fileName: PROOF_FILES[int(0, PROOF_FILES.length - 1, r)]!,
            url: '',
            sizeBytes: int(120_000, 2_400_000, r),
            uploadedAt: iso(submittedAt),
          }
        : undefined,
      expiresAt: iso(expiresAt),
      transferredAt: declared ? iso(addMinutes(submittedAt, -int(2, 40, r))) : undefined,
      submittedAt: declared ? iso(submittedAt) : undefined,
      confirmedAt: status === 'payment_confirmed' ? iso(confirmedAt) : undefined,
      rejectedAt: status === 'payment_rejected' ? iso(confirmedAt) : undefined,
      confirmedBy:
        status === 'payment_confirmed' || status === 'payment_rejected'
          ? appointment.psychologistId
          : undefined,
      rejectionReason:
        status === 'payment_rejected' ? 'Aucun transfert reçu à cette référence.' : undefined,
      events,
      createdAt: iso(createdAt),
    } satisfies Payment;
  });

export const paymentById = new Map(payments.map((p) => [p.id, p]));
