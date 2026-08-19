import type { Appointment, AppointmentStatus, ConsultationMode } from '@/types';
import { addDays, addMinutes, atTime, createRng, int, iso, startOfToday } from './seed';
import { psychologists } from './psychologists';
import { patients, CURRENT_PATIENT_ID, CURRENT_PSYCHOLOGIST_ID } from './patients';

const REASONS = [
  'Anxiété persistante depuis plusieurs mois',
  'Difficultés relationnelles au travail',
  'Suivi régulier',
  'Épisode dépressif',
  'Gestion du stress avant examens',
  'Séparation récente',
  'Troubles du sommeil',
  'Première consultation — bilan',
  'Conflit familial',
  'Perte de confiance en soi',
];

const DURATIONS = [30, 45, 60, 60, 60, 90];

function reference(n: number) {
  return `AMP-${String(2400 + n)}`;
}

/**
 * Appointments are generated across a window spanning ~90 days behind and
 * 21 days ahead of today, so every dashboard view (today / upcoming / history)
 * has meaningful content without any date being hardcoded.
 */
function build(): Appointment[] {
  const out: Appointment[] = [];
  const today = startOfToday();
  let n = 0;

  const push = (
    patientId: string,
    psychologistId: string,
    startsAt: Date,
    status: AppointmentStatus,
    r: () => number,
  ) => {
    const psy = psychologists.find((p) => p.id === psychologistId)!;
    const duration = DURATIONS[int(0, DURATIONS.length - 1, r)]!;
    const mode: ConsultationMode = r() > 0.85 ? 'audio' : 'video';
    const standardPrice = Math.round((psy.pricePerHour * duration) / 60 / 500) * 500;
    n += 1;
    out.push({
      id: `apt-${String(n).padStart(4, '0')}`,
      reference: reference(n),
      patientId,
      psychologistId,
      startsAt: iso(startsAt),
      endsAt: iso(addMinutes(startsAt, duration)),
      durationMinutes: duration,
      mode,
      status,
      // Free/paid is decided chronologically per pair, once the whole set
      // exists — see applyFirstConsultationRule below.
      price: standardPrice,
      standardPrice,
      isFirstConsultation: false,
      isFree: false,
      paymentRequired: true,
      currency: 'MAD',
      reason: REASONS[int(0, REASONS.length - 1, r)],
      meetingUrl:
        status === 'confirmed' || status === 'in_progress'
          ? `/consultation/apt-${String(n).padStart(4, '0')}`
          : undefined,
      createdAt: iso(addDays(startsAt, -int(2, 18, r))),
      ...(status === 'cancelled'
        ? {
            cancelledAt: iso(addDays(startsAt, -1)),
            cancellationReason: 'Annulé par le patient',
          }
        : {}),
    });
  };

  // --- Past consultations: the history that feeds reviews and payments -----
  for (let i = 0; i < 64; i++) {
    const r = createRng(9000 + i * 13);
    const patient = patients[i % patients.length]!;
    const psy = psychologists[(i * 3) % psychologists.length]!;
    if (!psy.isVerified) continue;
    const day = addDays(today, -int(2, 90, r));
    const start = atTime(day, int(9, 18, r), r() > 0.5 ? 30 : 0);
    const status: AppointmentStatus = r() > 0.9 ? (r() > 0.5 ? 'cancelled' : 'no_show') : 'completed';
    push(patient.id, psy.id, start, status, r);
  }

  // --- Upcoming: spread over the next three weeks -------------------------
  for (let i = 0; i < 26; i++) {
    const r = createRng(7700 + i * 29);
    const patient = patients[(i * 3) % patients.length]!;
    const psy = psychologists[(i * 7) % psychologists.length]!;
    if (!psy.isVerified) continue;
    const day = addDays(today, int(1, 21, r));
    const start = atTime(day, int(9, 18, r), r() > 0.5 ? 30 : 0);
    const roll = r();
    const status: AppointmentStatus =
      roll > 0.92 ? 'pending_payment' : roll > 0.84 ? 'payment_confirmation' : 'confirmed';
    push(patient.id, psy.id, start, status, r);
  }

  // --- Today, for the signed-in demo accounts ----------------------------
  // Guarantees the "next appointment" card and "today" stats are never empty.
  const demoR = createRng(4242);
  push(CURRENT_PATIENT_ID, CURRENT_PSYCHOLOGIST_ID, atTime(today, 18, 0), 'confirmed', demoR);
  push(CURRENT_PATIENT_ID, psychologists[2]!.id, atTime(addDays(today, 4), 11, 0), 'confirmed', demoR);
  push(CURRENT_PATIENT_ID, psychologists[4]!.id, atTime(addDays(today, 12), 15, 30), 'confirmed', demoR);
  push(CURRENT_PATIENT_ID, psychologists[1]!.id, atTime(addDays(today, -9), 14, 0), 'completed', demoR);
  push(CURRENT_PATIENT_ID, psychologists[8]!.id, atTime(addDays(today, -23), 10, 0), 'completed', demoR);
  push(CURRENT_PATIENT_ID, psychologists[0]!.id, atTime(addDays(today, -41), 16, 30), 'completed', demoR);

  // The demo patient always has one booking waiting to be paid, so the payment
  // instructions screen is reachable without going through a fresh booking.
  push(CURRENT_PATIENT_ID, psychologists[6]!.id, atTime(addDays(today, 2), 17, 0), 'pending_payment', demoR);

  for (let i = 1; i <= 4; i++) {
    push(
      patients[i]!.id,
      CURRENT_PSYCHOLOGIST_ID,
      atTime(today, 9 + i * 2, i % 2 ? 30 : 0),
      'confirmed',
      demoR,
    );
  }

  // Three transfers awaiting the demo practitioner's confirmation — the count
  // the dashboard alert announces.
  for (let i = 0; i < 3; i++) {
    push(
      patients[(i + 5) % patients.length]!.id,
      CURRENT_PSYCHOLOGIST_ID,
      atTime(addDays(today, i + 2), 14 + i, 0),
      'payment_confirmation',
      demoR,
    );
  }
  for (let i = 0; i < 7; i++) {
    push(
      patients[(i + 2) % patients.length]!.id,
      CURRENT_PSYCHOLOGIST_ID,
      atTime(addDays(today, i + 1), 10 + (i % 6), 0),
      'confirmed',
      demoR,
    );
  }

  return applyFirstConsultationRule(out.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
}

/**
 * Marks the free first consultation of every patient/practitioner pair.
 *
 * Walks the set chronologically and replays the real entitlement rule rather
 * than simply flagging each pair's earliest booking: a cancelled session gives
 * the entitlement back, and an in-flight free booking holds it until it either
 * completes or falls through.
 */
function applyFirstConsultationRule(sorted: Appointment[]): Appointment[] {
  const state = new Map<string, { consumed: boolean; holding: boolean }>();

  for (const appointment of sorted) {
    const key = `${appointment.patientId}:${appointment.psychologistId}`;
    const pair = state.get(key) ?? { consumed: false, holding: false };

    const free = !pair.consumed && !pair.holding;
    if (free) {
      appointment.isFirstConsultation = true;
      appointment.isFree = true;
      appointment.paymentRequired = false;
      appointment.price = 0;

      // Nothing to pay means nothing to wait for: a free booking is confirmed
      // the moment it is made, and its room opens on schedule.
      if (
        appointment.status === 'pending_payment' ||
        appointment.status === 'payment_confirmation'
      ) {
        appointment.status = 'confirmed';
        appointment.meetingUrl = `/consultation/${appointment.id}`;
      }
    }

    // A completed session — free or paid — spends the entitlement for good.
    if (appointment.status === 'completed') {
      pair.consumed = true;
      pair.holding = false;
    } else if (free && IN_FLIGHT.includes(appointment.status)) {
      pair.holding = true;
    }

    state.set(key, pair);
  }

  return sorted;
}

const IN_FLIGHT: AppointmentStatus[] = [
  'pending_payment',
  'payment_confirmation',
  'confirmed',
  'in_progress',
];

export const appointments: Appointment[] = build();

export const appointmentById = new Map(appointments.map((a) => [a.id, a]));
