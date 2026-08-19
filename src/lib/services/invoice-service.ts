import type { ConsultationInvoice, ConsultationInvoiceStatus, ID, Paginated } from '@/types';
import { api, ENDPOINTS, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { buildInvoice, buildInvoiceReference, isInvoiceable, summarise } from '@/lib/invoices';
import {
  consultationInvoiceById,
  consultationInvoices,
} from '@/lib/mock/consultation-invoices';
import { appointmentById } from '@/lib/mock/appointments';
import { payments } from '@/lib/mock/payments';
import { psychologistById } from '@/lib/mock/psychologists';
import { patientById } from '@/lib/mock/patients';

/**
 * Invoices minted during a session live in module memory, which a reload
 * discards — the practitioner would confirm a payment and then find no invoice.
 * Mirroring into sessionStorage keeps the mock flow coherent; the whole block
 * disappears once Laravel owns persistence. Mirrors `payment-service`.
 */
const SESSION_KEY = 'allomonpsy:mock-consultation-invoices';

function persist(invoice: ConsultationInvoice) {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(SESSION_KEY) ?? '[]',
    ) as ConsultationInvoice[];
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify([...stored, invoice]));
  } catch {
    // Storage disabled (private mode) — in-memory state still carries the session.
  }
}

function hydrateFromSession() {
  if (typeof window === 'undefined') return;
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(SESSION_KEY) ?? '[]',
    ) as ConsultationInvoice[];
    for (const invoice of stored) {
      if (!consultationInvoiceById.has(invoice.id)) {
        consultationInvoices.push(invoice);
        consultationInvoiceById.set(invoice.id, invoice);
      }
    }
  } catch {
    // Ignored for the same reason as above.
  }
}

function readable() {
  hydrateFromSession();
  return consultationInvoices;
}

export interface InvoiceQuery {
  psychologistId?: ID;
  patientId?: ID;
  status?: ConsultationInvoiceStatus[];
  page?: number;
  perPage?: number;
}

/**
 * Issues the invoice for a settled booking.
 *
 * Synchronous and mock-only: the payment and appointment services call it from
 * inside their own await, and an invoice is a local consequence of a state they
 * have already committed. Against Laravel the backend issues the invoice in the
 * same transaction as the confirmation, so no client call replaces this.
 *
 * Idempotent by appointment — re-confirming, or replaying a persisted session,
 * must never mint a second reference for one consultation.
 */
export function issueForAppointmentSync(appointmentId: ID): ConsultationInvoice | null {
  const existing = readable().find((invoice) => invoice.appointmentId === appointmentId);
  if (existing) return existing;

  const appointment = appointmentById.get(appointmentId);
  if (!appointment || !isInvoiceable(appointment)) return null;

  const psychologist = psychologistById.get(appointment.psychologistId);
  const patient = patientById.get(appointment.patientId);
  if (!psychologist || !patient) return null;

  const payment = payments.find(
    (candidate) =>
      candidate.appointmentId === appointmentId && candidate.status === 'payment_confirmed',
  );
  // Same rule as the seed: nothing is billed until the practitioner has
  // attested receipt of a required payment.
  if (appointment.paymentRequired && !payment) return null;

  const invoice = buildInvoice({
    appointment,
    psychologist,
    patient,
    payment,
    reference: buildInvoiceReference(consultationInvoices.length + 1),
  });

  consultationInvoices.push(invoice);
  consultationInvoiceById.set(invoice.id, invoice);
  persist(invoice);
  return invoice;
}

export const invoiceService = {
  /** GET /api/invoices */
  async list(query: InvoiceQuery = {}): Promise<Paginated<ConsultationInvoice>> {
    if (isLive('invoices')) {
      return api.get<Paginated<ConsultationInvoice>>(ENDPOINTS.invoices, {
        params: {
          psychologist_id: query.psychologistId,
          patient_id: query.patientId,
          status: query.status,
          page: query.page,
          per_page: query.perPage,
        },
      });
    }
    await delay(200);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const filtered = readable()
      .filter((i) => !query.psychologistId || i.psychologistId === query.psychologistId)
      .filter((i) => !query.patientId || i.patientId === query.patientId)
      .filter((i) => !query.status?.length || query.status.includes(i.status))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const start = (page - 1) * perPage;

    return {
      data: filtered.slice(start, start + perPage),
      meta: {
        total: filtered.length,
        page,
        perPage,
        lastPage: Math.max(1, Math.ceil(filtered.length / perPage)),
      },
    };
  },

  /** GET /api/invoices/{id} */
  async getById(id: ID): Promise<ConsultationInvoice | null> {
    if (isLive('invoices')) {
      return api.get<ConsultationInvoice>(ENDPOINTS.invoice(id)).catch(() => null);
    }
    await delay(120);
    return readable().find((invoice) => invoice.id === id) ?? null;
  },

  async getByAppointment(appointmentId: ID): Promise<ConsultationInvoice | null> {
    if (isLive('invoices')) {
      return api
        .get<ConsultationInvoice>(ENDPOINTS.invoices, { params: { appointment_id: appointmentId } })
        .catch(() => null);
    }
    await delay(120);
    return readable().find((invoice) => invoice.appointmentId === appointmentId) ?? null;
  },

  /**
   * POST /api/appointments/{id}/invoice
   *
   * Exposed for the rare manual re-issue; the normal path is automatic, on the
   * practitioner confirming the payment.
   */
  async issueForAppointment(appointmentId: ID): Promise<ConsultationInvoice | null> {
    if (isLive('invoices')) {
      return api
        .post<ConsultationInvoice>(`${ENDPOINTS.appointment(appointmentId)}/invoice`)
        .catch(() => null);
    }
    await delay(300);
    return issueForAppointmentSync(appointmentId);
  },

  /** Header totals for the practitioner's invoice list. */
  async statsFor(psychologistId: ID) {
    if (isLive('invoices')) {
      const all = await api.get<Paginated<ConsultationInvoice>>(ENDPOINTS.invoices, {
        params: { psychologist_id: psychologistId, per_page: 500 },
      });
      return summarise(all.data);
    }
    await delay(120);
    return summarise(readable().filter((invoice) => invoice.psychologistId === psychologistId));
  },
};
