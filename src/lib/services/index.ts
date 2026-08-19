/**
 * The only surface pages and components should import data from.
 *
 * Every service resolves against the mock repositories while
 * NEXT_PUBLIC_API_URL is empty, and against the Laravel REST API once it is
 * set. Keeping the import path stable is what makes that swap a one-line
 * environment change.
 */
export { psychologistService } from './psychologist-service';
export { appointmentService, hydrate as hydrateAppointment } from './appointment-service';
export type { AppointmentQuery, CreateAppointmentInput } from './appointment-service';
export { patientService } from './patient-service';
export { paymentService, hydratePayment } from './payment-service';
export { invoiceService } from './invoice-service';
export type { InvoiceQuery } from './invoice-service';
export { subscriptionService } from './subscription-service';
export type { PaySubscriptionInput, SubscriptionPaymentResult } from './subscription-service';
export type { PaymentQuery, SubmitProofInput } from './payment-service';
export { messageService } from './message-service';
export { adminService } from './admin-service';
export { authService } from './auth-service';
export type { AdminUser, AuthResult, AuthUser, RegisterInput } from './auth-service';
