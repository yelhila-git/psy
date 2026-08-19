/**
 * Consultation invoicing rules, kept free of any data source.
 *
 * The practitioner bills the patient directly — AlloMonPsy is never a party to
 * the transaction and takes no commission — so an invoice here is the
 * practitioner's own document, not a platform receipt. Everything in this file
 * is a pure function of an appointment plus the two parties, which is what lets
 * the same rules run against the mock store today and a Laravel payload later.
 */

import type {
  Appointment,
  ConsultationInvoice,
  ConsultationInvoiceLine,
  ConsultationMode,
  InvoiceParty,
  Patient,
  Payment,
  Psychologist,
} from '@/types';

/** Statuses whose appointment has earned an invoice. */
const INVOICEABLE: Appointment['status'][] = ['confirmed', 'in_progress', 'completed', 'no_show'];

/**
 * Whether this booking should carry an invoice.
 *
 * A no-show is included on purpose: the slot was reserved and paid for, so the
 * practitioner has something to bill. A booking still awaiting payment has not
 * been settled and must not produce a document.
 */
export function isInvoiceable(appointment: Pick<Appointment, 'status'>): boolean {
  return INVOICEABLE.includes(appointment.status);
}

/** "FAC-2026-00042" — the code printed on the document. */
export function buildInvoiceReference(sequence: number, date: Date = new Date()): string {
  return `FAC-${date.getFullYear()}-${String(sequence).padStart(5, '0')}`;
}

const MODE_LABELS: Record<ConsultationMode, string> = {
  video: 'Visioconférence',
  audio: 'Appel audio',
  chat: 'Messagerie',
};

export function modeLabel(mode: ConsultationMode): string {
  return MODE_LABELS[mode];
}

/**
 * The single billable line for a consultation.
 *
 * A free first consultation is billed at the standard rate and then discounted
 * to zero rather than being priced at zero outright: the practitioner — and the
 * patient — should see what the session was worth and what was waived.
 */
export function invoiceLines(appointment: Appointment): ConsultationInvoiceLine[] {
  return [
    {
      label: `Consultation psychologique — ${modeLabel(appointment.mode)}`,
      durationMinutes: appointment.durationMinutes,
      unitPrice: appointment.standardPrice,
      amount: appointment.standardPrice,
    },
  ];
}

/** Subtotal, waived amount and amount due, derived together so they agree. */
export function invoiceTotals(appointment: Appointment) {
  const subtotal = invoiceLines(appointment).reduce((sum, line) => sum + line.amount, 0);
  // `price` is authoritative: it already reflects the free-first-consultation
  // rule. The discount is whatever the rule gave away.
  const total = appointment.price;
  return { subtotal, discount: Math.max(0, subtotal - total), total };
}

function partyFromPsychologist(psy: Psychologist): InvoiceParty {
  return {
    id: psy.id,
    fullName: psy.fullName,
    email: psy.email,
    title: psy.title,
    city: psy.city,
  };
}

function partyFromPatient(patient: Patient): InvoiceParty {
  return { id: patient.id, fullName: patient.fullName, email: patient.email };
}

export interface BuildInvoiceInput {
  appointment: Appointment;
  psychologist: Psychologist;
  patient: Patient;
  /** Absent on a free consultation, which never has a transfer to quote. */
  payment?: Payment;
  reference: string;
  issuedAt?: Date;
}

/**
 * Assembles the document.
 *
 * The party and consultation blocks are copied in, not referenced, for the
 * reason given on `InvoiceParty`: this is a record of a past transaction.
 */
export function buildInvoice({
  appointment,
  psychologist,
  patient,
  payment,
  reference,
  issuedAt = new Date(),
}: BuildInvoiceInput): ConsultationInvoice {
  const { subtotal, discount, total } = invoiceTotals(appointment);

  return {
    id: `inv-${appointment.id}`,
    reference,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    psychologistId: appointment.psychologistId,
    issuer: partyFromPsychologist(psychologist),
    billedTo: partyFromPatient(patient),
    consultation: {
      appointmentReference: appointment.reference,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      durationMinutes: appointment.durationMinutes,
      mode: appointment.mode,
      isFirstConsultation: appointment.isFirstConsultation,
      reason: appointment.reason,
    },
    lines: invoiceLines(appointment),
    subtotal,
    discount,
    total,
    currency: appointment.currency,
    status: appointment.isFree ? 'free' : 'paid',
    paymentReference: payment?.reference,
    paymentMethod: payment?.method,
    // A paid invoice is only issued once the practitioner has attested receipt,
    // so the confirmation timestamp is the payment date.
    paidAt: appointment.isFree ? undefined : (payment?.confirmedAt ?? issuedAt.toISOString()),
    issuedAt: issuedAt.toISOString(),
  };
}

/** Totals for the practitioner's invoice list header. */
export function summarise(invoices: ConsultationInvoice[], now: Date = new Date()) {
  const live = invoices.filter((invoice) => invoice.status !== 'cancelled');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  return {
    issued: live.length,
    billedTotal: live.reduce((sum, invoice) => sum + invoice.total, 0),
    billedThisMonth: live
      .filter((invoice) => invoice.issuedAt >= monthStart)
      .reduce((sum, invoice) => sum + invoice.total, 0),
    freeCount: live.filter((invoice) => invoice.status === 'free').length,
    /** What the free-first-consultation rule gave away, in centimes. */
    waived: live.reduce((sum, invoice) => sum + invoice.discount, 0),
    currency: live[0]?.currency ?? 'MAD',
  };
}
