import type {
  ID,
  Paginated,
  Psychologist,
  PsychologistFilters,
  PsychologistStats,
  Review,
  Specialty,
  TimeSlot,
  VerificationStatus,
} from '@/types';
import { api, ENDPOINTS, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { findPsychologist, psychologists } from '@/lib/mock/psychologists';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { reviewsForPsychologist } from '@/lib/mock/reviews';
import { appointments } from '@/lib/mock/appointments';
import { payments } from '@/lib/mock/payments';
import { subscriptionByPsychologist } from '@/lib/mock/subscriptions';
import { resolveSubscription } from '@/lib/subscriptions';
import { addDays, atTime, startOfToday } from '@/lib/mock/seed';

const DEFAULT_PER_PAGE = 9;

/** The API takes snake_case; the domain type is camelCase. */
function toSnakePayload(payload: Partial<Psychologist>) {
  const { firstName, lastName, yearsOfExperience, pricePerHour, introVideoUrl,
    acceptsNewPatients, responseTimeMinutes, ...rest } = payload;
  return {
    ...rest,
    ...(firstName !== undefined && { first_name: firstName }),
    ...(lastName !== undefined && { last_name: lastName }),
    ...(yearsOfExperience !== undefined && { years_of_experience: yearsOfExperience }),
    ...(pricePerHour !== undefined && { price_per_hour: pricePerHour }),
    ...(introVideoUrl !== undefined && { intro_video_url: introVideoUrl }),
    ...(acceptsNewPatients !== undefined && { accepts_new_patients: acceptsNewPatients }),
    ...(responseTimeMinutes !== undefined && { response_time_minutes: responseTimeMinutes }),
  };
}

/**
 * A practitioner is listed publicly only while their subscription lets them
 * take bookings — an expired plan or an exhausted monthly quota removes them
 * from search rather than letting patients reach a dead end.
 */
function isBookable(p: Psychologist): boolean {
  const subscription = subscriptionByPsychologist.get(p.id);
  return subscription ? resolveSubscription(subscription).canAcceptBookings : false;
}

function matches(p: Psychologist, f: PsychologistFilters): boolean {
  if (f.verifiedOnly !== false && !p.isVerified) return false;

  if (f.query) {
    const q = f.query.toLowerCase().trim();
    const haystack = [p.fullName, p.title, p.headline, p.city, p.bio].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.specialties?.length && !f.specialties.some((s) => p.specialties.includes(s))) return false;
  if (f.languages?.length && !f.languages.some((l) => p.languages.includes(l))) return false;
  if (f.approaches?.length && !f.approaches.some((a) => p.approaches.includes(a))) return false;
  if (f.gender && f.gender !== 'any' && p.gender !== f.gender) return false;
  if (f.minPrice !== undefined && p.pricePerHour < f.minPrice) return false;
  if (f.maxPrice !== undefined && p.pricePerHour > f.maxPrice) return false;
  if (f.minExperience !== undefined && p.yearsOfExperience < f.minExperience) return false;
  if (f.maxExperience !== undefined && p.yearsOfExperience > f.maxExperience) return false;
  if (f.minRating !== undefined && p.rating < f.minRating) return false;

  if (f.availableWithinDays !== undefined) {
    if (!p.nextAvailableAt) return false;
    const limit = addDays(startOfToday(), f.availableWithinDays + 1);
    if (new Date(p.nextAvailableAt) >= limit) return false;
  }
  return true;
}

function sortList(list: Psychologist[], sort: PsychologistFilters['sort']): Psychologist[] {
  const sorted = [...list];
  switch (sort) {
    case 'price_asc':
      return sorted.sort((a, b) => a.pricePerHour - b.pricePerHour);
    case 'price_desc':
      return sorted.sort((a, b) => b.pricePerHour - a.pricePerHour);
    case 'rating_desc':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'experience_desc':
      return sorted.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    case 'availability':
      return sorted.sort((a, b) => (a.nextAvailableAt ?? 'z').localeCompare(b.nextAvailableAt ?? 'z'));
    default:
      // Relevance: verified and accepting first, then rating weighted by volume.
      return sorted.sort(
        (a, b) =>
          Number(b.acceptsNewPatients) - Number(a.acceptsNewPatients) ||
          b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
      );
  }
}

export const psychologistService = {
  /** GET /api/psychologists */
  async list(filters: PsychologistFilters = {}): Promise<Paginated<Psychologist>> {
    if (isLive('psychologists.list')) {
      return api.get<Paginated<Psychologist>>(ENDPOINTS.psychologists, {
        params: {
          q: filters.query,
          specialties: filters.specialties,
          languages: filters.languages,
          approaches: filters.approaches,
          gender: filters.gender,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          min_experience: filters.minExperience,
          max_experience: filters.maxExperience,
          available_within_days: filters.availableWithinDays,
          min_rating: filters.minRating,
          sort: filters.sort,
          page: filters.page,
          per_page: filters.perPage,
        },
      });
    }

    await delay();
    const page = Math.max(1, filters.page ?? 1);
    const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
    const filtered = sortList(
      psychologists.filter((p) => matches(p, filters) && isBookable(p)),
      filters.sort,
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

  /** GET /api/psychologists/{id} — accepts an id or a slug. */
  async getById(idOrSlug: ID): Promise<Psychologist | null> {
    if (isLive('psychologists.getById')) {
      return api.get<Psychologist>(ENDPOINTS.psychologist(idOrSlug)).catch(() => null);
    }
    await delay(180);
    return findPsychologist(idOrSlug) ?? null;
  },

  /**
   * The signed-in practitioner.
   *
   * The public route resolves a slug, never an id, so a practitioner's own
   * profile has to come from the authenticated endpoint.
   */
  async current(token?: string): Promise<Psychologist> {
    if (isLive('psychologists.current')) return api.get<Psychologist>('/me', { token });
    await delay(80);
    return findPsychologist(CURRENT_PSYCHOLOGIST_ID)!;
  },

  /** The homepage rail: the strongest verified profiles that take new patients. */
  async featured(limit = 6): Promise<Psychologist[]> {
    if (isLive('psychologists.featured')) {
      return api
        .get<Paginated<Psychologist>>(ENDPOINTS.psychologists, {
          params: { featured: true, per_page: limit },
        })
        .then((r) => r.data);
    }
    await delay(150);
    return sortList(
      psychologists.filter((p) => p.isVerified && p.acceptsNewPatients && isBookable(p)),
      'relevance',
    ).slice(0, limit);
  },

  /**
   * Number of bookable practitioners per specialty.
   *
   * Powers the therapy categories on the homepage — showing a real count keeps
   * the section honest and stops us linking to an empty result set.
   */
  async specialtyCounts(): Promise<Record<Specialty, number>> {
    if (isLive('psychologists.specialtyCounts')) {
      return api.get<Record<Specialty, number>>(`${ENDPOINTS.psychologists}/specialty-counts`);
    }
    await delay(100);

    const counts = {} as Record<Specialty, number>;
    for (const p of psychologists) {
      if (!p.isVerified || !isBookable(p)) continue;
      for (const specialty of p.specialties) {
        counts[specialty] = (counts[specialty] ?? 0) + 1;
      }
    }
    return counts;
  },

  /** GET /api/psychologists/{id}/reviews */
  async reviews(psychologistId: ID): Promise<Review[]> {
    if (isLive('psychologists.reviews')) return api.get<Review[]>(ENDPOINTS.psychologistReviews(psychologistId));
    await delay(140);
    return reviewsForPsychologist(psychologistId);
  },

  /**
   * GET /api/psychologists/{id}/slots?date=YYYY-MM-DD
   *
   * Resolves the practitioner's weekly availability rules into concrete slots
   * for a given day, subtracting anything already booked.
   */
  async slotsForDate(psychologistId: ID, date: Date, durationMinutes = 60): Promise<TimeSlot[]> {
    if (isLive('psychologists.slotsForDate')) {
      return api.get<TimeSlot[]>(ENDPOINTS.psychologistSlots(psychologistId), {
        params: { date: date.toISOString().slice(0, 10), duration: durationMinutes },
      });
    }
    await delay(120);

    const psy = findPsychologist(psychologistId);
    if (!psy) return [];

    const rule = psy.availability.find((a) => a.weekday === date.getDay());
    if (!rule?.enabled || rule.ranges.length === 0) return [];

    const booked = new Set(
      appointments
        .filter(
          (a) =>
            a.psychologistId === psychologistId &&
            a.status !== 'cancelled' &&
            new Date(a.startsAt).toDateString() === date.toDateString(),
        )
        .map((a) => new Date(a.startsAt).getTime()),
    );

    const slots: TimeSlot[] = [];
    const now = new Date();

    // Each block is walked independently, so the gaps between them (lunch, a
    // break between two consultations) never produce a bookable slot.
    for (const range of rule.ranges) {
      const [startHour, startMinute] = range.startTime.split(':').map(Number);
      const [endHour, endMinute] = range.endTime.split(':').map(Number);

      const cursor = atTime(date, startHour!, startMinute ?? 0);
      const end = atTime(date, endHour!, endMinute ?? 0);

      while (cursor.getTime() + durationMinutes * 60_000 <= end.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
        slots.push({
          id: `slot-${psychologistId}-${slotStart.getTime()}`,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          // A slot is bookable if it isn't taken, isn't in the past, and the
          // practitioner isn't paused.
          available: !booked.has(slotStart.getTime()) && slotStart > now && psy.acceptsNewPatients,
        });
        cursor.setMinutes(cursor.getMinutes() + 30);
      }
    }

    return slots.sort((a, b) => a.start.localeCompare(b.start));
  },

  /** POST /api/psychologists — psychologist self-registration. */
  async register(payload: Partial<Psychologist>): Promise<{ id: ID; status: VerificationStatus }> {
    if (isLive('psychologists.register')) {
      return api.post<{ id: ID; status: VerificationStatus }>(ENDPOINTS.psychologists, toSnakePayload(payload));
    }
    await delay(700);
    return { id: `psy-${Date.now()}`, status: 'pending' };
  },

  /** PATCH /api/psychologists/{id} */
  async update(id: ID, payload: Partial<Psychologist>): Promise<Psychologist | null> {
    if (isLive('psychologists.update')) return api.patch<Psychologist>(ENDPOINTS.psychologist(id), toSnakePayload(payload));
    await delay(400);
    const existing = findPsychologist(id);
    return existing ? { ...existing, ...payload } : null;
  },

  /** Dashboard KPIs for the signed-in practitioner. */
  async stats(psychologistId: ID): Promise<PsychologistStats> {
    if (isLive('psychologists.stats')) {
      return api.get<PsychologistStats>(`${ENDPOINTS.psychologist(psychologistId)}/stats`);
    }
    await delay(160);

    const psy = findPsychologist(psychologistId);
    const mine = appointments.filter((a) => a.psychologistId === psychologistId);
    const today = startOfToday();
    const weekEnd = addDays(today, 7);

    const todayCount = mine.filter(
      (a) => new Date(a.startsAt).toDateString() === today.toDateString() && a.status !== 'cancelled',
    ).length;

    const weekCount = mine.filter((a) => {
      const d = new Date(a.startsAt);
      return d >= today && d < weekEnd && a.status !== 'cancelled';
    }).length;

    // The practitioner is paid in full, directly by the patient, so earnings
    // are the gross amount — the platform's commission is invoiced separately.
    const thisMonth = new Date().getMonth();
    const monthEarnings = payments
      .filter(
        (p) =>
          p.psychologistId === psychologistId &&
          p.status === 'payment_confirmed' &&
          new Date(p.createdAt).getMonth() === thisMonth,
      )
      .reduce((sum, p) => sum + p.amount, 0);

    const completed = mine.filter((a) => a.status === 'completed').length;
    const thisMonthSessions = mine.filter((a) => {
      const start = new Date(a.startsAt);
      return start.getMonth() === thisMonth && a.status !== 'cancelled';
    });
    const finished = mine.filter((a) =>
      ['completed', 'cancelled', 'no_show'].includes(a.status),
    ).length;

    const earningsTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const amount = payments
        .filter(
          (p) =>
            p.psychologistId === psychologistId &&
            p.status === 'payment_confirmed' &&
            new Date(p.createdAt).getMonth() === d.getMonth(),
        )
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        month: d.toLocaleDateString('fr-FR', { month: 'short' }),
        amount,
      };
    });

    return {
      freeConsultations: thisMonthSessions.filter((a) => a.isFree).length,
      paidConsultations: thisMonthSessions.filter((a) => !a.isFree).length,
      todayAppointments: todayCount,
      weekAppointments: weekCount,
      totalPatients: new Set(mine.map((a) => a.patientId)).size,
      monthEarnings,
      currency: 'MAD',
      completionRate: finished ? Math.round((completed / finished) * 100) : 100,
      averageRating: psy?.rating ?? 0,
      earningsTrend,
    };
  },
};
