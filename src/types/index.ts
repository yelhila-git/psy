/**
 * Domain types for the AlloMonPsy marketplace.
 *
 * These mirror the payloads the Laravel REST API will return, so swapping the
 * mock repositories for HTTP calls is a change of data source only — no
 * component or page needs to be touched.
 *
 * Conventions:
 *  - ids are strings (Laravel returns them as strings over JSON)
 *  - timestamps are ISO 8601 strings
 *  - money is an integer in centimes, paired with an ISO currency code
 */

export type ID = string;
export type ISODate = string;

export type Language = 'fr' | 'ar' | 'ary' | 'en' | 'es' | 'ber';

export type Specialty =
  | 'anxiety'
  | 'depression'
  | 'stress'
  | 'couple'
  | 'family'
  | 'child'
  | 'adolescent'
  | 'trauma'
  | 'addiction'
  | 'eating'
  | 'sleep'
  | 'grief'
  | 'self-esteem'
  | 'work';

export type TherapyApproach =
  | 'cbt'
  | 'psychoanalysis'
  | 'systemic'
  | 'emdr'
  | 'humanist'
  | 'mindfulness'
  | 'act';

export type Gender = 'male' | 'female' | 'other';

export type UserRole = 'patient' | 'psychologist' | 'admin';

export type VerificationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';

export type AppointmentStatus =
  | 'pending_payment'
  /** Patient declared the transfer; waiting for the practitioner to confirm receipt. */
  | 'payment_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * Payment lifecycle for the direct transfer model.
 *
 * The patient transfers the fee straight to the practitioner's own bank
 * account — the platform never touches the money and never acts as a PSP.
 * It only records what each party declares, which is why confirmation is a
 * human act by the practitioner and never an automatic consequence of the
 * patient uploading a proof.
 */
export type PaymentStatus =
  /** First consultation between this patient and this practitioner — nothing to pay. */
  | 'payment_free'
  | 'payment_pending'
  | 'payment_proof_submitted'
  | 'payment_confirmed'
  | 'payment_rejected'
  /** The payment window elapsed; the appointment was released automatically. */
  | 'payment_expired';

/**
 * How the patient moves the money. No online payment method exists by design.
 *
 * The platform supports instant transfers only — the method Moroccan patients
 * reach for and the one that clears fast enough for a practitioner to confirm
 * before the session. Kept as a union so a second method can be added without
 * reshaping every payment record.
 */
export type TransferMethod = 'instant_transfer';

// ---------------------------------------------------------------------------
// Subscriptions — the platform's only source of revenue
// ---------------------------------------------------------------------------

export type SubscriptionPlanId = 'free' | 'starter' | 'pro' | 'premium';

export type SubscriptionStatus = 'active' | 'past_due' | 'expired' | 'cancelled';

export type SubscriptionInvoiceStatus = 'pending' | 'paid' | 'failed';

/**
 * A subscription charge.
 *
 * Unlike consultations — which the platform never touches — subscriptions are
 * collected by AlloMonPsy itself through a single CMI merchant account, so a
 * real card transaction exists and has to be receipted.
 */
export interface SubscriptionInvoice {
  id: ID;
  /** Human-facing code on the receipt, e.g. "SUB-2026-00042". */
  reference: string;
  psychologistId: ID;
  planId: SubscriptionPlanId;
  planName: string;
  /** Centimes actually charged — the prorated difference on an upgrade. */
  amount: number;
  /** The plan's full monthly price, shown alongside a prorated amount. */
  fullAmount: number;
  /** Days covered when the charge is prorated; absent on a full month. */
  proratedDays?: number;
  currency: string;
  status: SubscriptionInvoiceStatus;
  /**
   * Last four digits of the card. The only card data that ever leaves the
   * gateway — nothing else is transmitted to or stored by the platform.
   */
  cardLast4?: string;
  /** CMI transaction reference, for reconciliation with the bank. */
  gatewayReference?: string;
  periodStart: ISODate;
  periodEnd: ISODate;
  issuedAt: ISODate;
  paidAt?: ISODate;
  failureReason?: string;
}

/** What a plan change will cost, computed before the practitioner commits. */
export interface SubscriptionChangeQuote {
  planId: SubscriptionPlanId;
  planName: string;
  /** Centimes due now. Zero on a downgrade or a move to the free tier. */
  amount: number;
  fullAmount: number;
  currency: string;
  /** True when `amount` covers only the remainder of the current period. */
  prorated: boolean;
  remainingDays: number;
  periodDays: number;
  periodEnd: ISODate;
  /** No charge: downgrade, free plan, or same plan. */
  paymentRequired: boolean;
}

export type ConsultationMode = 'video' | 'audio' | 'chat';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface BaseUser {
  id: ID;
  role: UserRole;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  locale: Language;
  createdAt: ISODate;
}

export interface Patient extends BaseUser {
  role: 'patient';
  gender?: Gender;
  dateOfBirth?: ISODate;
  city?: string;
  /** Psychologist ids the patient has favourited. */
  favoritePsychologistIds: ID[];
  appointmentCount: number;
  notes?: string;
}

export interface Education {
  id: ID;
  degree: string;
  institution: string;
  year: number;
}

export interface ExperienceItem {
  id: ID;
  role: string;
  organization: string;
  startYear: number;
  endYear?: number;
  description?: string;
}

export interface VerificationDocument {
  id: ID;
  type: 'diploma' | 'license' | 'identity' | 'insurance';
  fileName: string;
  uploadedAt: ISODate;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

/** One continuous block of open time inside a day. */
export interface TimeRange {
  id: ID;
  startTime: string; // "09:00"
  endTime: string; // "12:00"
}

/**
 * A recurring weekly availability rule. 0 = Sunday.
 *
 * A practitioner rarely works one uninterrupted stretch, so each day holds a
 * list of discrete blocks (08:00–09:00, 11:00–12:00, 22:00–23:00…) rather than
 * a single start/end pair.
 */
export interface AvailabilityRule {
  id: ID;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  enabled: boolean;
  ranges: TimeRange[];
}

/** A concrete bookable slot resolved for a given date. */
export interface TimeSlot {
  id: ID;
  start: ISODate;
  end: ISODate;
  available: boolean;
}

export interface Psychologist extends BaseUser {
  role: 'psychologist';
  slug: string;
  gender: Gender;
  title: string; // "Psychologue clinicienne"
  headline: string; // one-line positioning
  bio: string;
  /** Short self-recorded introduction shown on the public profile. */
  introVideoUrl?: string;
  specialties: Specialty[];
  approaches: TherapyApproach[];
  languages: Language[];
  yearsOfExperience: number;
  education: Education[];
  experience: ExperienceItem[];
  city: string;
  /** Price for a standard 60-minute consultation, in centimes. */
  pricePerHour: number;
  currency: string;
  rating: number; // 0–5, one decimal
  reviewCount: number;
  patientCount: number;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  acceptsNewPatients: boolean;
  modes: ConsultationMode[];
  /** ISO timestamp of the earliest free slot — powers the "available today" filter. */
  nextAvailableAt?: ISODate;
  responseTimeMinutes: number;
  availability: AvailabilityRule[];
  documents?: VerificationDocument[];
  submittedAt?: ISODate;
  approvedAt?: ISODate;
  profileCompletion: number; // 0–100
}

// ---------------------------------------------------------------------------
// Appointments, payments, reviews, messages
// ---------------------------------------------------------------------------

export interface Appointment {
  id: ID;
  reference: string; // human-facing code, e.g. AMP-2481
  patientId: ID;
  psychologistId: ID;
  startsAt: ISODate;
  endsAt: ISODate;
  durationMinutes: number;
  mode: ConsultationMode;
  status: AppointmentStatus;
  /** Centimes actually due — 0 on a free first consultation. */
  price: number;
  /** The practitioner's standard rate for this duration, free or not. */
  standardPrice: number;
  currency: string;
  /**
   * First consultation between this patient and this practitioner. The right
   * is per pair, not per patient, and is only spent once a session completes.
   */
  isFirstConsultation: boolean;
  isFree: boolean;
  paymentRequired: boolean;
  reason?: string;
  notes?: string;
  meetingUrl?: string;
  createdAt: ISODate;
  cancelledAt?: ISODate;
  cancellationReason?: string;
}

/** Appointment joined with the two participants — what list screens render. */
export interface AppointmentWithParties extends Appointment {
  patient: Pick<Patient, 'id' | 'fullName' | 'avatarUrl' | 'email'>;
  psychologist: Pick<
    Psychologist,
    'id' | 'fullName' | 'avatarUrl' | 'title' | 'slug' | 'specialties'
  >;
}

/** Screenshot or bank receipt the patient attaches to their declaration. */
export interface PaymentProof {
  fileName: string;
  /** Object URL in mock mode; a signed, private URL once Laravel stores it. */
  url: string;
  sizeBytes: number;
  uploadedAt: ISODate;
}

/**
 * One entry in the payment's audit trail. Because money changes hands off
 * platform, this history is the only record of who claimed what and when —
 * the admin arbitrates disputes from it.
 */
export interface PaymentEvent {
  id: ID;
  at: ISODate;
  actorRole: UserRole | 'system';
  actorId?: ID;
  label: string;
  note?: string;
}

export interface Payment {
  id: ID;
  /** Transfer reference the patient must quote, e.g. "APT-2026-00125". */
  reference: string;
  appointmentId: ID;
  patientId: ID;
  psychologistId: ID;
  /**
   * Centimes the patient transfers, in full, to the practitioner. The platform
   * takes no commission and never touches this money.
   */
  amount: number;
  currency: string;
  /** Method the patient declares having used; empty until they declare. */
  method?: TransferMethod;
  status: PaymentStatus;
  proof?: PaymentProof;
  /** Deadline for the patient to declare the transfer. */
  expiresAt: ISODate;
  /** When the patient says the transfer left their account. */
  transferredAt?: ISODate;
  submittedAt?: ISODate;
  confirmedAt?: ISODate;
  rejectedAt?: ISODate;
  /** Practitioner (or admin) id that settled the payment. */
  confirmedBy?: ID;
  rejectionReason?: string;
  events: PaymentEvent[];
  createdAt: ISODate;
}

/** Payment joined with both parties and its appointment — what review screens render. */
export interface PaymentWithParties extends Payment {
  patient: Pick<Patient, 'id' | 'fullName' | 'avatarUrl' | 'email'>;
  psychologist: Pick<Psychologist, 'id' | 'fullName' | 'avatarUrl' | 'title' | 'slug'>;
  appointment: Pick<
    Appointment,
    'id' | 'reference' | 'startsAt' | 'endsAt' | 'durationMinutes' | 'status'
  >;
}

/**
 * The practitioner's own transfer details, shown to a patient only after that
 * patient has booked. Never part of the public profile payload.
 */
export interface PsychologistPaymentInfo {
  psychologistId: ID;
  accountHolderName: string;
  bankName: string;
  rib: string;
  iban?: string;
  /** The number the instant transfer is sent to — the essential coordinate. */
  phone: string;
  /** The practitioner decides which extra coordinates the patient sees. */
  visibility: { rib: boolean; iban: boolean };
  instructions?: string;
  /** Bookings are blocked while this is false — nobody should book blind. */
  isActive: boolean;
  updatedAt: ISODate;
}

/** The patient-facing subset: the practitioner's hidden fields are stripped out. */
export interface PaymentInstructions {
  accountHolderName: string;
  bankName: string;
  phone: string;
  rib?: string;
  iban?: string;
  instructions?: string;
}

/**
 * A subscription tier. Prices and quotas are admin-configurable, which is why
 * they live in data rather than being hardcoded into the gating logic.
 */
export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  pricePerMonth: number; // centimes
  currency: string;
  /** Consultations allowed per billing period; null means unlimited. */
  monthlyQuota: number | null;
  tagline: string;
  features: string[];
}

/**
 * A practitioner's subscription. Consultations are counted against the plan's
 * quota for the current period — the platform bills the practitioner, never
 * the patient, and takes no cut of any consultation.
 */
export interface Subscription {
  id: ID;
  psychologistId: ID;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: ISODate;
  periodStart: ISODate;
  periodEnd: ISODate;
  /** Consultations already booked in the current period. */
  periodUsage: number;
  cancelledAt?: ISODate;
}

/** Subscription resolved against its plan — what dashboards render. */
export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan;
  /** null when the plan is unlimited. */
  quotaRemaining: number | null;
  quotaReached: boolean;
  /** Active subscription with quota left: the practitioner can take bookings. */
  canAcceptBookings: boolean;
}

export interface Review {
  id: ID;
  appointmentId: ID;
  psychologistId: ID;
  patientId: ID;
  patientName: string;
  patientAvatarUrl: string;
  rating: number; // 1–5
  title?: string;
  comment: string;
  createdAt: ISODate;
  /** Reviews are only published once the consultation actually happened. */
  isVerifiedConsultation: boolean;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  senderRole: UserRole;
  body: string;
  sentAt: ISODate;
  readAt?: ISODate;
  attachments?: { id: ID; name: string; url: string; size: number }[];
}

export interface Conversation {
  id: ID;
  patientId: ID;
  psychologistId: ID;
  /** The other party, resolved for the current viewer. */
  participant: {
    id: ID;
    fullName: string;
    avatarUrl: string;
    subtitle: string;
  };
  lastMessage: Pick<Message, 'body' | 'sentAt' | 'senderId'>;
  unreadCount: number;
  updatedAt: ISODate;
}

// ---------------------------------------------------------------------------
// Query, filtering and pagination contracts
// ---------------------------------------------------------------------------

export type SortOption =
  | 'relevance'
  | 'rating_desc'
  | 'price_asc'
  | 'price_desc'
  | 'experience_desc'
  | 'availability';

export interface PsychologistFilters {
  query?: string;
  specialties?: Specialty[];
  languages?: Language[];
  approaches?: TherapyApproach[];
  gender?: Gender | 'any';
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  maxExperience?: number;
  availableWithinDays?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

/** Matches Laravel's paginator envelope so the shape survives the swap. */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

export interface AdminStats {
  psychologists: number;
  /** Practitioners with a live subscription — the ones actually serving. */
  activePsychologists: number;
  pendingVerifications: number;
  patients: number;
  appointments: number;
  freeConsultations: number;
  paidConsultations: number;
  /** Monthly recurring revenue from practitioner subscriptions, in centimes. */
  subscriptionRevenue: number;
  /** Money patients paid practitioners directly. Informational only — the
   *  platform never receives a centime of it. */
  practitionerVolume: number;
  currency: string;
  revenueTrend: { month: string; subscriptions: number; consultations: number }[];
}

/** One practitioner's subscription, flattened for the admin table. */
export interface SubscriptionRow {
  psychologistId: ID;
  fullName: string;
  avatarUrl: string;
  planId: SubscriptionPlanId;
  planName: string;
  pricePerMonth: number;
  status: SubscriptionStatus;
  periodUsage: number;
  monthlyQuota: number | null;
  renewsAt: ISODate;
}

/**
 * Paginated admin reports carry period totals alongside the page of rows, so
 * the stat tiles above a table describe the whole filtered set rather than
 * whatever happens to be on screen.
 */
export interface SubscriptionsReport extends Paginated<SubscriptionRow> {
  totals: {
    /** Monthly recurring revenue across the filtered set, in centimes. */
    mrr: number;
    active: number;
    pastDue: number;
    expired: number;
  };
}

export interface PaymentsReport extends Paginated<PaymentWithParties> {
  totals: {
    /** Counts per stage of the confirmation funnel. */
    pending: number;
    toConfirm: number;
    confirmed: number;
    rejected: number;
    /** Money confirmed as received by practitioners, in centimes. */
    confirmedAmount: number;
  };
}

export interface PsychologistStats {
  todayAppointments: number;
  weekAppointments: number;
  totalPatients: number;
  /** Collected directly from patients — no commission is deducted. */
  monthEarnings: number;
  freeConsultations: number;
  paidConsultations: number;
  currency: string;
  completionRate: number;
  averageRating: number;
  earningsTrend: { month: string; amount: number }[];
}

export interface PatientStats {
  upcomingCount: number;
  completedCount: number;
  totalSpent: number;
  currency: string;
  favoriteCount: number;
}
