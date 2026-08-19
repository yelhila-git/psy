import type {
  Appointment,
  AppointmentStatus,
  AppointmentWithParties,
  ConsultationMode,
  ID,
} from '@/types';
import { api, ENDPOINTS, USE_MOCK } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { consultationTerms, isFirstConsultation } from '@/lib/consultations';
import { issueForAppointmentSync } from './invoice-service';
import { appointments, appointmentById } from '@/lib/mock/appointments';
import { psychologistById } from '@/lib/mock/psychologists';
import { patientById } from '@/lib/mock/patients';
import { startOfToday } from '@/lib/mock/seed';

/** Joins an appointment with both participants for list rendering. */
export function hydrate(a: Appointment): AppointmentWithParties {
  const psy = psychologistById.get(a.psychologistId)!;
  const patient = patientById.get(a.patientId)!;
  return {
    ...a,
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
      specialties: psy.specialties,
    },
  };
}

export interface AppointmentQuery {
  patientId?: ID;
  psychologistId?: ID;
  status?: AppointmentStatus[];
  /** 'upcoming' keeps future non-cancelled sessions; 'past' keeps everything else. */
  scope?: 'upcoming' | 'past' | 'today' | 'all';
  limit?: number;
}

/**
 * Appointments created during a session live only in module memory, which the
 * browser discards on reload — the patient would lose their booking between
 * /booking and /payment. Mirroring them into sessionStorage keeps the mock
 * flow coherent. This whole block disappears once Laravel owns persistence.
 */
const SESSION_KEY = 'allomonpsy:mock-appointments';

function persist(appointment: Appointment) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? '[]') as Appointment[];
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...stored, appointment]));
  } catch {
    // Storage disabled (private mode) — in-memory state still carries the session.
  }
}

function restore(): Appointment[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? '[]') as Appointment[];
  } catch {
    return [];
  }
}

/** Rehydrates session-created appointments into the in-memory store, once. */
function hydrateFromSession() {
  for (const appointment of restore()) {
    if (!appointmentById.has(appointment.id)) {
      appointments.push(appointment);
      appointmentById.set(appointment.id, appointment);
    }
  }
}

/**
 * Every appointment between one patient and one practitioner.
 *
 * The free-consultation entitlement is scoped to the pair, so this is the only
 * slice of history the rule ever looks at.
 */
function historyBetween(patientId: ID, psychologistId: ID): Appointment[] {
  return appointments.filter(
    (a) => a.patientId === patientId && a.psychologistId === psychologistId,
  );
}

export interface CreateAppointmentInput {
  patientId: ID;
  psychologistId: ID;
  startsAt: string;
  durationMinutes: number;
  mode: ConsultationMode;
  /** The practitioner's usual rate. Whether it is actually charged is decided
   *  server-side from the pair's history, never by the client. */
  standardPrice: number;
  currency: string;
  reason?: string;
}

/** What a patient will be charged for their next session with a practitioner. */
export interface ConsultationTerms {
  isFirstConsultation: boolean;
  isFree: boolean;
  paymentRequired: boolean;
  price: number;
  standardPrice: number;
}

export const appointmentService = {
  /** GET /api/appointments */
  async list(query: AppointmentQuery = {}): Promise<AppointmentWithParties[]> {
    if (!USE_MOCK) {
      return api.get<AppointmentWithParties[]>(ENDPOINTS.appointments, {
        params: {
          patient_id: query.patientId,
          psychologist_id: query.psychologistId,
          status: query.status,
          scope: query.scope,
          limit: query.limit,
        },
      });
    }
    await delay(200);

    const now = new Date();
    const today = startOfToday();

    let result = appointments.filter((a) => {
      if (query.patientId && a.patientId !== query.patientId) return false;
      if (query.psychologistId && a.psychologistId !== query.psychologistId) return false;
      if (query.status?.length && !query.status.includes(a.status)) return false;

      const start = new Date(a.startsAt);
      switch (query.scope) {
        case 'upcoming':
          return start >= now && a.status !== 'cancelled' && a.status !== 'completed';
        case 'past':
          return start < now || a.status === 'completed' || a.status === 'cancelled';
        case 'today':
          return start.toDateString() === today.toDateString() && a.status !== 'cancelled';
        default:
          return true;
      }
    });

    result =
      query.scope === 'past'
        ? result.sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        : result.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    if (query.limit) result = result.slice(0, query.limit);
    return result.map(hydrate);
  },

  /** GET /api/appointments/{id} */
  async getById(id: ID): Promise<AppointmentWithParties | null> {
    if (!USE_MOCK) {
      return api.get<AppointmentWithParties>(ENDPOINTS.appointment(id)).catch(() => null);
    }
    await delay(150);
    hydrateFromSession();
    const found = appointmentById.get(id);
    return found ? hydrate(found) : null;
  },

  /** The single next confirmed session — drives the dashboard hero card. */
  async next(query: Pick<AppointmentQuery, 'patientId' | 'psychologistId'>) {
    const list = await this.list({ ...query, scope: 'upcoming', limit: 1 });
    return list[0] ?? null;
  },

  /**
   * GET /api/psychologists/{id}/consultation-terms
   *
   * Whether the next session between this pair is the free one. Screens call
   * this before showing a price so the profile, the booking flow and the
   * created appointment can never disagree.
   */
  async terms(
    patientId: ID,
    psychologistId: ID,
    standardPrice: number,
  ): Promise<ConsultationTerms> {
    if (!USE_MOCK) {
      return api.get<ConsultationTerms>(
        `/psychologists/${psychologistId}/consultation-terms`,
        { params: { patient_id: patientId } },
      );
    }
    await delay(120);
    hydrateFromSession();
    return consultationTerms(standardPrice, historyBetween(patientId, psychologistId));
  },

  /**
   * Practitioners this patient still has their free first session with.
   *
   * Listing screens render many practitioners at once, so they resolve the
   * entitlement in one call rather than one request per card.
   */
  async freeConsultationPsychologistIds(patientId: ID, candidateIds: ID[]): Promise<Set<ID>> {
    if (!USE_MOCK) {
      const ids = await api.get<ID[]>('/consultation-terms/free', {
        params: { patient_id: patientId, psychologist_ids: candidateIds },
      });
      return new Set(ids);
    }
    await delay(90);
    hydrateFromSession();
    return new Set(
      candidateIds.filter((psychologistId) =>
        isFirstConsultation(historyBetween(patientId, psychologistId)),
      ),
    );
  },

  /** Has this patient ever consulted this practitioner? Drives the profile badge. */
  async isFirstConsultation(patientId: ID, psychologistId: ID): Promise<boolean> {
    if (!USE_MOCK) {
      const result = await api.get<{ isFirstConsultation: boolean }>(
        `/psychologists/${psychologistId}/consultation-terms`,
        { params: { patient_id: patientId } },
      );
      return result.isFirstConsultation;
    }
    await delay(100);
    hydrateFromSession();
    return isFirstConsultation(historyBetween(patientId, psychologistId));
  },

  /** POST /api/appointments */
  async create(input: CreateAppointmentInput): Promise<AppointmentWithParties> {
    if (!USE_MOCK) {
      return api.post<AppointmentWithParties>(ENDPOINTS.appointments, {
        patient_id: input.patientId,
        psychologist_id: input.psychologistId,
        starts_at: input.startsAt,
        duration_minutes: input.durationMinutes,
        mode: input.mode,
        reason: input.reason,
      });
    }
    await delay(600);

    const start = new Date(input.startsAt);
    const id = `apt-new-${start.getTime()}`;

    // Recomputed here rather than trusted from the caller: a client that says
    // "this one is free" must not be able to make it so.
    hydrateFromSession();
    const terms = consultationTerms(
      input.standardPrice,
      historyBetween(input.patientId, input.psychologistId),
    );

    const created: Appointment = {
      id,
      reference: `AMP-${String(start.getTime()).slice(-4)}`,
      patientId: input.patientId,
      psychologistId: input.psychologistId,
      startsAt: input.startsAt,
      endsAt: new Date(start.getTime() + input.durationMinutes * 60_000).toISOString(),
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      // A free session has nothing to settle, so it is confirmed on creation.
      status: terms.isFree ? 'confirmed' : 'pending_payment',
      ...terms,
      currency: input.currency,
      reason: input.reason,
      meetingUrl: terms.isFree ? `/consultation/${id}` : undefined,
      createdAt: new Date().toISOString(),
    };

    appointments.push(created);
    appointmentById.set(id, created);
    persist(created);
    // A free session is confirmed the moment it is booked, so there is no
    // payment confirmation to hang its invoice off — it is billed at zero here
    // instead. Paid bookings are invoiced by `paymentService.confirm`.
    if (created.isFree) issueForAppointmentSync(created.id);
    return hydrate(created);
  },

  /** PATCH /api/appointments/{id} */
  async updateStatus(id: ID, status: AppointmentStatus, reason?: string) {
    if (!USE_MOCK) {
      return api.patch<Appointment>(ENDPOINTS.appointment(id), { status, cancellation_reason: reason });
    }
    await delay(350);
    const found = appointmentById.get(id);
    if (!found) return null;
    found.status = status;
    if (status === 'cancelled') {
      found.cancelledAt = new Date().toISOString();
      found.cancellationReason = reason;
    }
    if (status === 'confirmed') found.meetingUrl = `/consultation/${id}`;
    return found;
  },

  async cancel(id: ID, reason: string) {
    return this.updateStatus(id, 'cancelled', reason);
  },
};
