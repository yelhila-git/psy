/**
 * The free-first-consultation rule.
 *
 * The entitlement is per PAIR — one free session between a given patient and a
 * given practitioner, not one per patient. Youssef gets a free first session
 * with Sara *and* a free first session with Ahmed; his second with Sara is
 * billed.
 *
 * Two rules matter and pull in opposite directions, which is why they are
 * stated here once rather than re-derived in each screen:
 *
 *  - A cancelled booking never burns the entitlement. Someone who books and
 *    cancels must still get their free session.
 *  - An in-flight free booking holds the entitlement while it exists, so the
 *    same patient cannot stack several free slots with one practitioner before
 *    any of them completes.
 */

import type { Appointment, AppointmentStatus } from '@/types';

/** Statuses where a booking is still live and holding its slot. */
const IN_FLIGHT: AppointmentStatus[] = [
  'pending_payment',
  'payment_confirmation',
  'confirmed',
  'in_progress',
];

type HistoryEntry = Pick<Appointment, 'status' | 'isFree'>;

/** A completed session is what actually spends the entitlement. */
export function hasCompletedConsultation(history: HistoryEntry[]): boolean {
  return history.some((appointment) => appointment.status === 'completed');
}

/** A free booking that has not yet happened still holds the entitlement. */
export function hasPendingFreeConsultation(history: HistoryEntry[]): boolean {
  return history.some((a) => a.isFree && IN_FLIGHT.includes(a.status));
}

/**
 * Whether the next booking between this pair is the free first consultation.
 *
 * `history` must be every appointment between the two parties, in any order.
 */
export function isFirstConsultation(history: HistoryEntry[]): boolean {
  return !hasCompletedConsultation(history) && !hasPendingFreeConsultation(history);
}

/** Price actually due, given the entitlement. */
export function priceFor(standardPrice: number, free: boolean): number {
  return free ? 0 : standardPrice;
}

/**
 * The three booking facts every screen needs, derived together so they can
 * never contradict each other.
 */
export function consultationTerms(standardPrice: number, history: HistoryEntry[]) {
  const free = isFirstConsultation(history);
  return {
    isFirstConsultation: free,
    isFree: free,
    paymentRequired: !free,
    price: priceFor(standardPrice, free),
    standardPrice,
  };
}
