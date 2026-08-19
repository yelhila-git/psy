import type { ConsultationInvoice } from '@/types';
import { buildInvoice, buildInvoiceReference, isInvoiceable } from '@/lib/invoices';
import { appointments } from './appointments';
import { payments } from './payments';
import { psychologistById } from './psychologists';
import { patientById } from './patients';

/**
 * One invoice per consultation the practitioner has actually secured.
 *
 * Seeded from the appointment set rather than invented, so the invoice list and
 * the payments list can never disagree about what was billed. Bookings still
 * awaiting payment produce nothing — there is no document until the money is
 * attested, which is exactly the rule the live flow applies on confirmation.
 */
const confirmedPaymentByAppointment = new Map(
  payments
    .filter((payment) => payment.status === 'payment_confirmed')
    .map((payment) => [payment.appointmentId, payment]),
);

export const consultationInvoices: ConsultationInvoice[] = appointments
  .filter(isInvoiceable)
  // Chronological, so invoice numbers run in the order the sessions were
  // secured. A reference that jumps around looks like a lost document.
  .slice()
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  .flatMap((appointment, index) => {
    const psychologist = psychologistById.get(appointment.psychologistId);
    const patient = patientById.get(appointment.patientId);
    if (!psychologist || !patient) return [];

    const payment = confirmedPaymentByAppointment.get(appointment.id);
    // A paid session with no confirmed transfer was never settled; billing it
    // would put a document in front of a patient who owes nothing yet.
    if (appointment.paymentRequired && !payment) return [];

    const issuedAt = new Date(payment?.confirmedAt ?? appointment.createdAt);

    return [
      buildInvoice({
        appointment,
        psychologist,
        patient,
        payment,
        reference: buildInvoiceReference(index + 1, issuedAt),
        issuedAt,
      }),
    ];
  });

export const consultationInvoiceById = new Map(
  consultationInvoices.map((invoice) => [invoice.id, invoice]),
);

export const consultationInvoicesByPsychologist = new Map<string, ConsultationInvoice[]>();
for (const invoice of consultationInvoices) {
  const list = consultationInvoicesByPsychologist.get(invoice.psychologistId) ?? [];
  list.push(invoice);
  consultationInvoicesByPsychologist.set(invoice.psychologistId, list);
}
