/**
 * Business rules for the direct-transfer payment model.
 *
 * Everything here is pure: no mock data, no network, no React. The service
 * layer and the UI both call into these functions so a rule is stated once —
 * in particular the one rule that matters most, `canJoinConsultation`, which
 * is the only thing standing between an unpaid booking and a live session.
 */

import type {
  Appointment,
  AppointmentStatus,
  Payment,
  PaymentInstructions,
  PaymentStatus,
  PsychologistPaymentInfo,
} from '@/types';
import { PAYMENT_WINDOW_MINUTES } from '@/lib/constants';

/**
 * When the patient's payment window closes.
 *
 * Capped at the session start: a consultation booked for 18:00 at 17:50 gives
 * ten minutes to pay, not thirty, otherwise the deadline would fall after the
 * appointment it is meant to protect.
 */
export function paymentWindowEnd(
  createdAt: string | Date,
  startsAt: string | Date,
  windowMinutes: number = PAYMENT_WINDOW_MINUTES,
): Date {
  const created = new Date(createdAt).getTime();
  const start = new Date(startsAt).getTime();
  return new Date(Math.min(created + windowMinutes * 60_000, start));
}

/** True once the window has closed on a payment nobody has declared yet. */
export function isPaymentExpired(payment: Payment, now: number = Date.now()): boolean {
  return payment.status === 'payment_pending' && new Date(payment.expiresAt).getTime() <= now;
}

export function millisecondsLeft(payment: Payment, now: number = Date.now()): number {
  return Math.max(0, new Date(payment.expiresAt).getTime() - now);
}

/** "28:42" — the countdown the patient reads while making the transfer. */
export function formatCountdown(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The gate on the consultation room.
 *
 * Both halves are required: the practitioner confirming the money AND the
 * appointment being live. A confirmed payment on a cancelled slot must not
 * open a room, and a confirmed slot never opens before the money is in.
 */
export function canJoinConsultation(
  appointment: Pick<Appointment, 'status' | 'paymentRequired'>,
  payment: Pick<Payment, 'status'> | null | undefined,
): boolean {
  const liveStatuses: AppointmentStatus[] = ['confirmed', 'in_progress'];
  if (!liveStatuses.includes(appointment.status)) return false;
  // A free first consultation has nothing to confirm — being confirmed is enough.
  if (!appointment.paymentRequired) return true;
  return payment?.status === 'payment_confirmed';
}

/**
 * The payment status a screen should display.
 *
 * Free consultations carry no payment record at all — creating one for a zero
 * amount would pollute every payment list and report — so the status is
 * derived from the appointment instead.
 */
export function displayPaymentStatus(
  appointment: Pick<Appointment, 'paymentRequired'>,
  payment: Pick<Payment, 'status'> | null | undefined,
): PaymentStatus | undefined {
  if (!appointment.paymentRequired) return 'payment_free';
  return payment?.status;
}

export type LockReason =
  | 'awaiting_payment'
  | 'awaiting_confirmation'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'completed'
  | null;

/** Why the room is locked, so each state can carry its own copy and CTA. */
export function consultationLockReason(
  appointment: Pick<Appointment, 'status' | 'paymentRequired'>,
  payment: Pick<Payment, 'status'> | null | undefined,
): LockReason {
  if (canJoinConsultation(appointment, payment)) return null;
  if (appointment.status === 'cancelled' || appointment.status === 'no_show') return 'cancelled';
  if (appointment.status === 'completed') return 'completed';

  switch (payment?.status) {
    case 'payment_proof_submitted':
      return 'awaiting_confirmation';
    case 'payment_rejected':
      return 'rejected';
    case 'payment_expired':
      return 'expired';
    default:
      return 'awaiting_payment';
  }
}

/** Payments the practitioner has to rule on — the confirmation queue. */
export function needsConfirmation(payment: Pick<Payment, 'status'>): boolean {
  return payment.status === 'payment_proof_submitted';
}

/**
 * Strips the coordinates the practitioner chose to keep hidden.
 *
 * The full `PsychologistPaymentInfo` must never reach a page: this is the only
 * shape the patient is ever handed.
 */
export function visibleInstructions(info: PsychologistPaymentInfo): PaymentInstructions {
  return {
    accountHolderName: info.accountHolderName,
    bankName: info.bankName,
    // Always shown: an instant transfer is sent to a phone number, so hiding
    // it would leave the patient with no way to pay at all.
    phone: info.phone,
    rib: info.visibility.rib ? info.rib : undefined,
    iban: info.visibility.iban ? info.iban : undefined,
    instructions: info.instructions,
  };
}

/** A practitioner without a receiving number cannot take bookings. */
export function acceptsBookings(info: PsychologistPaymentInfo | null | undefined): boolean {
  if (!info || !info.isActive) return false;
  return info.phone.trim().length > 0;
}

/** "230 780 1234 5678 9012 3456 78" — RIBs are read aloud, so group them. */
export function formatRib(rib: string): string {
  return rib
    .replace(/\s/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** Transfer reference the patient quotes to their bank: "APT-2026-00125". */
export function buildPaymentReference(sequence: number, date: Date = new Date()): string {
  return `APT-${date.getFullYear()}-${String(sequence).padStart(5, '0')}`;
}
