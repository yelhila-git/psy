import type {
  ID,
  Paginated,
  Payment,
  PaymentEvent,
  PaymentInstructions,
  PaymentStatus,
  PaymentWithParties,
  PsychologistPaymentInfo,
  TransferMethod,
} from '@/types';
import { api, ENDPOINTS, USE_MOCK } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import {
  buildPaymentReference,
  isPaymentExpired,
  needsConfirmation,
  paymentWindowEnd,
  visibleInstructions,
} from '@/lib/payments';
import { payments, paymentById } from '@/lib/mock/payments';
import { paymentInfoByPsychologist } from '@/lib/mock/payment-info';
import { appointmentById } from '@/lib/mock/appointments';
import { psychologistById } from '@/lib/mock/psychologists';
import { patientById } from '@/lib/mock/patients';

/** Joins a payment with both parties and its appointment for review screens. */
export function hydratePayment(payment: Payment): PaymentWithParties {
  const psy = psychologistById.get(payment.psychologistId)!;
  const patient = patientById.get(payment.patientId)!;
  const appointment = appointmentById.get(payment.appointmentId)!;

  return {
    ...payment,
    patient: {
      id: patient.id,
      fullName: patient.fullName,
      avatarUrl: patient.avatarUrl,
      email: patient.email,
    },
    psychologist: {
      id: psy.id,
      fullName: psy.fullName,
      avatarUrl: psy.avatarUrl,
      title: psy.title,
      slug: psy.slug,
    },
    appointment: {
      id: appointment.id,
      reference: appointment.reference,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
    },
  };
}

/**
 * Payments created during a session live in module memory, which a reload
 * discards — the patient would land on the payment screen with no payment.
 * Mirroring into sessionStorage keeps the mock flow coherent; the whole block
 * disappears once Laravel owns persistence. Mirrors `appointment-service`.
 */
const SESSION_KEY = 'allomonpsy:mock-payments';

function persist(payment: Payment) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? '[]') as Payment[];
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...stored, payment]));
  } catch {
    // Storage disabled (private mode) — in-memory state still carries the session.
  }
}

function hydrateFromSession() {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? '[]') as Payment[];
    for (const payment of stored) {
      if (!paymentById.has(payment.id)) {
        payments.push(payment);
        paymentById.set(payment.id, payment);
      }
    }
  } catch {
    // Ignored for the same reason as above.
  }
}

function event(label: string, actorRole: PaymentEvent['actorRole'], actorId?: ID, note?: string) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actorRole,
    actorId,
    label,
    note,
  } satisfies PaymentEvent;
}

/**
 * Releases every booking whose payment window elapsed.
 *
 * There is no scheduler in front of a mock store, so expiry is evaluated
 * lazily on read. Laravel will run this as a scheduled command instead — the
 * resulting states are identical either way.
 */
function sweepExpired() {
  const now = Date.now();
  for (const payment of payments) {
    if (!isPaymentExpired(payment, now)) continue;

    payment.status = 'payment_expired';
    payment.events.push(event('Délai de paiement dépassé, créneau libéré', 'system'));

    const appointment = appointmentById.get(payment.appointmentId);
    if (appointment && appointment.status === 'pending_payment') {
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date().toISOString();
      appointment.cancellationReason = 'Paiement non effectué dans le délai imparti';
    }
  }
}

/** Reads the mock store after bringing it up to date. */
function readable() {
  hydrateFromSession();
  sweepExpired();
  return payments;
}

export interface SubmitProofInput {
  paymentId: ID;
  method: TransferMethod;
  /** When the patient says the money left their account. */
  transferredAt: string;
  proof?: { fileName: string; url: string; sizeBytes: number };
}

export interface PaymentQuery {
  patientId?: ID;
  psychologistId?: ID;
  status?: PaymentStatus[];
  page?: number;
  perPage?: number;
}

export const paymentService = {
  /** GET /api/payments */
  async list(query: PaymentQuery = {}): Promise<Paginated<PaymentWithParties>> {
    if (!USE_MOCK) {
      return api.get<Paginated<PaymentWithParties>>(ENDPOINTS.payments, {
        params: {
          patient_id: query.patientId,
          psychologist_id: query.psychologistId,
          status: query.status,
          page: query.page,
          per_page: query.perPage,
        },
      });
    }
    await delay(200);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const filtered = readable()
      .filter((p) => !query.patientId || p.patientId === query.patientId)
      .filter((p) => !query.psychologistId || p.psychologistId === query.psychologistId)
      .filter((p) => !query.status?.length || query.status.includes(p.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * perPage;

    return {
      data: filtered.slice(start, start + perPage).map(hydratePayment),
      meta: {
        total: filtered.length,
        page,
        perPage,
        lastPage: Math.max(1, Math.ceil(filtered.length / perPage)),
      },
    };
  },

  async getById(id: ID): Promise<PaymentWithParties | null> {
    if (!USE_MOCK) return api.get<PaymentWithParties>(ENDPOINTS.payment(id)).catch(() => null);
    await delay(120);
    const found = readable().find((p) => p.id === id);
    return found ? hydratePayment(found) : null;
  },

  async getByAppointment(appointmentId: ID): Promise<PaymentWithParties | null> {
    if (!USE_MOCK) {
      return api
        .get<PaymentWithParties>(ENDPOINTS.payments, {
          params: { appointment_id: appointmentId },
        })
        .catch(() => null);
    }
    await delay(120);
    const found = readable().find((p) => p.appointmentId === appointmentId);
    return found ? hydratePayment(found) : null;
  },

  /**
   * POST /api/payments — opens the payment window on a fresh booking.
   *
   * Idempotent: re-entering the payment screen must not mint a second
   * reference for the same appointment.
   */
  async create(appointmentId: ID): Promise<PaymentWithParties> {
    if (!USE_MOCK) {
      return api.post<PaymentWithParties>(ENDPOINTS.payments, {
        appointment_id: appointmentId,
      });
    }
    await delay(400);

    const existing = readable().find((p) => p.appointmentId === appointmentId);
    if (existing) return hydratePayment(existing);

    const appointment = appointmentById.get(appointmentId);
    if (!appointment) throw new Error('Rendez-vous introuvable');
    if (!appointment.paymentRequired) {
      throw new Error('Cette consultation est gratuite : aucun paiement à créer');
    }

    const now = new Date();
    const payment: Payment = {
      id: `pay-new-${now.getTime()}`,
      reference: buildPaymentReference(payments.length + 1, now),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      psychologistId: appointment.psychologistId,
      amount: appointment.price,
      currency: appointment.currency,
      status: 'payment_pending',
      expiresAt: paymentWindowEnd(now, appointment.startsAt).toISOString(),
      events: [event('Réservation créée, paiement en attente', 'system')],
      createdAt: now.toISOString(),
    };

    payments.push(payment);
    paymentById.set(payment.id, payment);
    persist(payment);
    return hydratePayment(payment);
  },

  /**
   * POST /api/payments/{id}/proof — the patient declares the transfer.
   *
   * Deliberately does NOT confirm anything: only the practitioner can attest
   * that money reached their account. Uploading a screenshot proves intent,
   * not receipt.
   */
  async submitProof(input: SubmitProofInput): Promise<PaymentWithParties | null> {
    if (!USE_MOCK) {
      return api.post<PaymentWithParties>(`${ENDPOINTS.payment(input.paymentId)}/proof`, {
        method: input.method,
        transferred_at: input.transferredAt,
        proof: input.proof,
      });
    }
    await delay(700);

    const payment = readable().find((p) => p.id === input.paymentId);
    if (!payment) return null;

    const now = new Date().toISOString();
    payment.status = 'payment_proof_submitted';
    payment.method = input.method;
    payment.transferredAt = input.transferredAt;
    payment.submittedAt = now;
    payment.rejectionReason = undefined;
    payment.rejectedAt = undefined;
    if (input.proof) payment.proof = { ...input.proof, uploadedAt: now };
    payment.events.push(
      event(
        input.proof
          ? 'Le patient a déclaré le paiement et joint une preuve'
          : 'Le patient a déclaré avoir effectué le paiement',
        'patient',
        payment.patientId,
      ),
    );

    const appointment = appointmentById.get(payment.appointmentId);
    if (appointment) appointment.status = 'payment_confirmation';

    return hydratePayment(payment);
  },

  /** POST /api/payments/{id}/confirm — the practitioner attests receipt. */
  async confirm(paymentId: ID, actorId: ID): Promise<PaymentWithParties | null> {
    if (!USE_MOCK) {
      return api.post<PaymentWithParties>(`${ENDPOINTS.payment(paymentId)}/confirm`);
    }
    await delay(500);

    const payment = readable().find((p) => p.id === paymentId);
    if (!payment) return null;

    payment.status = 'payment_confirmed';
    payment.confirmedAt = new Date().toISOString();
    payment.confirmedBy = actorId;
    payment.events.push(
      event('Le psychologue a confirmé la réception du paiement', 'psychologist', actorId),
    );

    const appointment = appointmentById.get(payment.appointmentId);
    if (appointment) {
      appointment.status = 'confirmed';
      appointment.meetingUrl = `/consultation/${appointment.id}`;
    }

    return hydratePayment(payment);
  },

  /**
   * POST /api/payments/{id}/reject — the money never arrived.
   *
   * The booking is not destroyed: it falls back to "awaiting payment" with a
   * fresh window so the patient can correct a wrong reference or retry, and
   * the reason is shown to them. An outright cancellation would punish the
   * common case, which is a transfer sent late or badly labelled.
   */
  async reject(paymentId: ID, actorId: ID, reason: string): Promise<PaymentWithParties | null> {
    if (!USE_MOCK) {
      return api.post<PaymentWithParties>(`${ENDPOINTS.payment(paymentId)}/reject`, { reason });
    }
    await delay(500);

    const payment = readable().find((p) => p.id === paymentId);
    if (!payment) return null;

    const appointment = appointmentById.get(payment.appointmentId);

    payment.status = 'payment_rejected';
    payment.rejectedAt = new Date().toISOString();
    payment.confirmedBy = actorId;
    payment.rejectionReason = reason;
    payment.proof = undefined;
    if (appointment) {
      payment.expiresAt = paymentWindowEnd(new Date(), appointment.startsAt).toISOString();
      appointment.status = 'pending_payment';
      appointment.meetingUrl = undefined;
    }
    payment.events.push(
      event('Le psychologue n’a pas reçu le paiement', 'psychologist', actorId, reason),
    );

    return hydratePayment(payment);
  },

  /**
   * Payment status keyed by appointment id.
   *
   * List screens render dozens of bookings and each needs its payment state to
   * decide what to show; one lookup table beats one request per card.
   */
  async statusByAppointment(
    query: Pick<PaymentQuery, 'patientId' | 'psychologistId'>,
  ): Promise<Record<ID, PaymentStatus>> {
    if (!USE_MOCK) {
      return api.get<Record<ID, PaymentStatus>>('/payments/status-map', {
        params: {
          patient_id: query.patientId,
          psychologist_id: query.psychologistId,
        },
      });
    }
    await delay(100);

    const map: Record<ID, PaymentStatus> = {};

    // Free consultations carry no payment record, so their status is derived
    // from the appointment. Seeded first so a real payment always wins.
    for (const appointment of appointmentById.values()) {
      if (appointment.paymentRequired) continue;
      if (query.patientId && appointment.patientId !== query.patientId) continue;
      if (query.psychologistId && appointment.psychologistId !== query.psychologistId) continue;
      map[appointment.id] = 'payment_free';
    }

    for (const payment of readable()) {
      if (query.patientId && payment.patientId !== query.patientId) continue;
      if (query.psychologistId && payment.psychologistId !== query.psychologistId) continue;
      map[payment.appointmentId] = payment.status;
    }
    return map;
  },

  /** Badge count for the practitioner's "payments to confirm" queue. */
  async pendingConfirmationCount(psychologistId: ID): Promise<number> {
    if (!USE_MOCK) {
      const result = await api.get<Paginated<Payment>>(ENDPOINTS.payments, {
        params: {
          psychologist_id: psychologistId,
          status: ['payment_proof_submitted'],
        },
      });
      return result.meta.total;
    }
    await delay(80);
    return readable().filter((p) => p.psychologistId === psychologistId && needsConfirmation(p))
      .length;
  },

  // --- Practitioner transfer coordinates ------------------------------------

  /** GET /api/psychologists/{id}/payment-info — the practitioner's own view. */
  async paymentInfo(psychologistId: ID): Promise<PsychologistPaymentInfo | null> {
    if (!USE_MOCK) {
      return api
        .get<PsychologistPaymentInfo>(`/psychologists/${psychologistId}/payment-info`)
        .catch(() => null);
    }
    await delay(150);
    return paymentInfoByPsychologist.get(psychologistId) ?? null;
  },

  /** PUT /api/psychologists/{id}/payment-info */
  async updatePaymentInfo(
    psychologistId: ID,
    input: Omit<PsychologistPaymentInfo, 'psychologistId' | 'updatedAt'>,
  ): Promise<PsychologistPaymentInfo> {
    if (!USE_MOCK) {
      return api.put<PsychologistPaymentInfo>(
        `/psychologists/${psychologistId}/payment-info`,
        input,
      );
    }
    await delay(600);

    const updated: PsychologistPaymentInfo = {
      ...input,
      psychologistId,
      updatedAt: new Date().toISOString(),
    };
    paymentInfoByPsychologist.set(psychologistId, updated);
    return updated;
  },

  /**
   * GET /api/appointments/{id}/payment-instructions
   *
   * Scoped to a booking on purpose: the practitioner's coordinates are only
   * ever released to a patient who has an appointment with them, and only the
   * fields that practitioner chose to expose.
   */
  async instructionsForAppointment(appointmentId: ID): Promise<PaymentInstructions | null> {
    if (!USE_MOCK) {
      return api
        .get<PaymentInstructions>(`${ENDPOINTS.appointment(appointmentId)}/payment-instructions`)
        .catch(() => null);
    }
    await delay(150);

    const appointment = appointmentById.get(appointmentId);
    if (!appointment) return null;
    const info = paymentInfoByPsychologist.get(appointment.psychologistId);
    if (!info || !info.isActive) return null;
    return visibleInstructions(info);
  },
};
