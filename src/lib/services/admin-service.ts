import type {
  AdminStats,
  AppointmentWithParties,
  ID,
  Paginated,
  Patient,
  PaymentsReport,
  Psychologist,
  SubscriptionRow,
  SubscriptionsReport,
  VerificationStatus,
} from '@/types';
import type { PaymentStatus, SubscriptionStatus } from '@/types';
import { api, ENDPOINTS, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { withinRange } from '@/lib/date-range';
import { hydrate } from '@/lib/services/appointment-service';
import { hydratePayment } from '@/lib/services/payment-service';
import { psychologists, psychologistById } from '@/lib/mock/psychologists';
import { patients, patientById } from '@/lib/mock/patients';
import { appointments } from '@/lib/mock/appointments';
import { payments } from '@/lib/mock/payments';
import { subscriptions } from '@/lib/mock/subscriptions';
import { planById } from '@/lib/constants';
import { isSubscriptionActive, resolveSubscription } from '@/lib/subscriptions';

/** Shared shape of every filterable admin table query. */
export interface AdminTableQuery {
  q?: string;
  from?: string; // "YYYY-MM-DD", inclusive
  to?: string; // "YYYY-MM-DD", inclusive
  page?: number;
  perPage?: number;
}

const paginate = <T>(rows: T[], page: number, perPage: number): Paginated<T> => ({
  data: rows.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
  meta: {
    total: rows.length,
    page,
    perPage,
    lastPage: Math.max(1, Math.ceil(rows.length / perPage)),
  },
});

export const adminService = {
  /** GET /api/admin/stats */
  async stats(): Promise<AdminStats> {
    if (isLive('admin')) return api.get<AdminStats>(ENDPOINTS.adminStats);
    await delay(220);

    const paid = payments.filter((p) => p.status === 'payment_confirmed');
    const live = subscriptions.filter((sub) => isSubscriptionActive(sub.status));

    const monthlyRevenue = (planId: string) => planById.get(planId as never)?.pricePerMonth ?? 0;
    const subscriptionRevenue = live.reduce((sum, sub) => sum + monthlyRevenue(sub.planId), 0);

    const revenueTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthly = paid.filter((p) => new Date(p.createdAt).getMonth() === d.getMonth());
      return {
        month: d.toLocaleDateString('fr-FR', { month: 'short' }),
        // Subscriptions are the platform's income; consultation volume is
        // shown beside it purely to size the marketplace.
        subscriptions: subscriptionRevenue,
        consultations: monthly.reduce((sum, p) => sum + p.amount, 0),
      };
    });

    return {
      psychologists: psychologists.length,
      activePsychologists: live.length,
      pendingVerifications: psychologists.filter((p) => p.verificationStatus === 'pending').length,
      patients: patients.length,
      appointments: appointments.length,
      freeConsultations: appointments.filter((a) => a.isFree).length,
      paidConsultations: appointments.filter((a) => !a.isFree).length,
      subscriptionRevenue,
      practitionerVolume: paid.reduce((sum, p) => sum + p.amount, 0),
      currency: 'MAD',
      revenueTrend,
    };
  },

  /** GET /api/admin/verifications — the moderation queue. */
  async psychologists(
    query: { status?: VerificationStatus | 'all'; q?: string; page?: number; perPage?: number } = {},
  ): Promise<Paginated<Psychologist>> {
    if (isLive('admin')) {
      return api.get<Paginated<Psychologist>>(ENDPOINTS.adminVerifications, {
        params: { status: query.status, q: query.q, page: query.page, per_page: query.perPage },
      });
    }
    await delay(240);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const filtered = psychologists
      .filter((p) => !query.status || query.status === 'all' || p.verificationStatus === query.status)
      .filter((p) =>
        query.q
          ? [p.fullName, p.email, p.title].join(' ').toLowerCase().includes(query.q.toLowerCase())
          : true,
      )
      // Pending profiles first — that is the queue an admin actually works.
      .sort(
        (a, b) =>
          Number(b.verificationStatus === 'pending') - Number(a.verificationStatus === 'pending') ||
          (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''),
      );
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

  /** POST /api/admin/psychologists/{id}/approve|reject */
  async setVerification(id: ID, status: VerificationStatus, note?: string) {
    if (isLive('admin')) {
      return api.post<Psychologist>(`/admin/psychologists/${id}/verification`, { status, note });
    }
    await delay(450);
    const psy = psychologistById.get(id);
    if (!psy) return null;
    psy.verificationStatus = status;
    psy.isVerified = status === 'approved';
    if (status === 'approved') psy.approvedAt = new Date().toISOString();
    return psy;
  },

  /** GET /api/admin/payments — searchable on reference, patient and practitioner. */
  async payments(
    query: AdminTableQuery & { status?: PaymentStatus | 'all' } = {},
  ): Promise<PaymentsReport> {
    if (isLive('admin')) {
      return api.get<PaymentsReport>('/admin/payments', {
        params: {
          q: query.q,
          status: query.status,
          from: query.from,
          to: query.to,
          page: query.page,
          per_page: query.perPage,
        },
      });
    }
    await delay(200);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 12;
    const needle = query.q?.trim().toLowerCase();

    // The funnel tiles describe the whole period, so they are computed before
    // the status filter narrows the rows to one stage.
    const inPeriod = payments
      .filter((p) => withinRange(p.createdAt, query.from, query.to))
      .filter((p) => {
        if (!needle) return true;
        const haystack = [
          p.reference,
          patientById.get(p.patientId)?.fullName ?? '',
          psychologistById.get(p.psychologistId)?.fullName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      });

    const filtered = inPeriod
      .filter((p) => !query.status || query.status === 'all' || p.status === query.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const confirmed = inPeriod.filter((p) => p.status === 'payment_confirmed');

    return {
      ...paginate(filtered.map(hydratePayment), page, perPage),
      totals: {
        pending: inPeriod.filter((p) => p.status === 'payment_pending').length,
        toConfirm: inPeriod.filter((p) => p.status === 'payment_proof_submitted').length,
        confirmed: confirmed.length,
        rejected: inPeriod.filter((p) => p.status === 'payment_rejected').length,
        confirmedAmount: confirmed.reduce((sum, p) => sum + p.amount, 0),
      },
    };
  },

  /**
   * GET /api/admin/subscriptions — the platform's revenue book.
   *
   * Subscriptions are the only money the platform ever sees, so this replaces
   * what used to be the commission report.
   */
  async subscriptions(
    query: AdminTableQuery & { status?: SubscriptionStatus | 'all' } = {},
  ): Promise<SubscriptionsReport> {
    if (isLive('admin')) {
      return api.get<SubscriptionsReport>('/admin/subscriptions', {
        params: {
          q: query.q,
          status: query.status,
          page: query.page,
          per_page: query.perPage,
        },
      });
    }
    await delay(220);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 10;
    const needle = query.q?.trim().toLowerCase();

    const resolved = subscriptions.map(resolveSubscription);

    const rows: SubscriptionRow[] = resolved
      .flatMap((subscription) => {
        const psy = psychologistById.get(subscription.psychologistId);
        if (!psy) return [];
        return [
          {
            psychologistId: subscription.psychologistId,
            fullName: psy.fullName,
            avatarUrl: psy.avatarUrl,
            planId: subscription.planId,
            planName: subscription.plan.name,
            pricePerMonth: subscription.plan.pricePerMonth,
            status: subscription.status,
            periodUsage: subscription.periodUsage,
            monthlyQuota: subscription.plan.monthlyQuota,
            renewsAt: subscription.periodEnd,
          } satisfies SubscriptionRow,
        ];
      })
      .filter((row) => (needle ? row.fullName.toLowerCase().includes(needle) : true))
      .filter((row) => !query.status || query.status === 'all' || row.status === query.status)
      .sort((a, b) => b.pricePerMonth - a.pricePerMonth);

    return {
      ...paginate(rows, page, perPage),
      totals: {
        mrr: rows
          .filter((row) => row.status === 'active')
          .reduce((sum, row) => sum + row.pricePerMonth, 0),
        active: rows.filter((row) => row.status === 'active').length,
        pastDue: rows.filter((row) => row.status === 'past_due').length,
        expired: rows.filter((row) => row.status === 'expired' || row.status === 'cancelled').length,
      },
    };
  },

  /** GET /api/admin/appointments — every consultation, filtered by session date. */
  async appointments(
    query: AdminTableQuery = {},
  ): Promise<Paginated<AppointmentWithParties> & { totals: Record<string, number> }> {
    if (isLive('admin')) {
      return api.get<Paginated<AppointmentWithParties> & { totals: Record<string, number> }>(
        '/admin/appointments',
        {
          params: {
            q: query.q,
            from: query.from,
            to: query.to,
            page: query.page,
            per_page: query.perPage,
          },
        },
      );
    }
    await delay(220);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 12;
    const needle = query.q?.trim().toLowerCase();

    const filtered = appointments
      .map(hydrate)
      .filter((a) => withinRange(a.startsAt, query.from, query.to))
      .filter((a) => {
        if (!needle) return true;
        return [a.reference, a.patient.fullName, a.psychologist.fullName]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

    return {
      ...paginate(filtered, page, perPage),
      totals: {
        total: filtered.length,
        confirmed: filtered.filter((a) => a.status === 'confirmed').length,
        completed: filtered.filter((a) => a.status === 'completed').length,
        cancelled: filtered.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length,
      },
    };
  },

  /** GET /api/admin/patients — filtered on the registration date. */
  async patients(query: AdminTableQuery = {}): Promise<Paginated<Patient>> {
    if (isLive('admin')) {
      return api.get<Paginated<Patient>>('/admin/patients', {
        params: {
          q: query.q,
          from: query.from,
          to: query.to,
          page: query.page,
          per_page: query.perPage,
        },
      });
    }
    await delay(200);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 12;
    const needle = query.q?.trim().toLowerCase();

    const filtered = patients
      .filter((p) => withinRange(p.createdAt, query.from, query.to))
      .filter((p) =>
        needle
          ? [p.fullName, p.email, p.city ?? ''].join(' ').toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return paginate(filtered, page, perPage);
  },
};
