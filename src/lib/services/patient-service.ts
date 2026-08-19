import type { ID, Paginated, Patient, PatientStats, Psychologist } from '@/types';
import { api, ENDPOINTS, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { patients, patientById, CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { psychologistById } from '@/lib/mock/psychologists';
import { appointments } from '@/lib/mock/appointments';
import { payments } from '@/lib/mock/payments';

export const patientService = {
  /** GET /api/patients */
  async list(page = 1, perPage = 10, query?: string): Promise<Paginated<Patient>> {
    if (isLive('patients')) {
      return api.get<Paginated<Patient>>(ENDPOINTS.patients, {
        params: { page, per_page: perPage, q: query },
      });
    }
    await delay(220);
    const filtered = query
      ? patients.filter((p) =>
          [p.fullName, p.email, p.city ?? ''].join(' ').toLowerCase().includes(query.toLowerCase()),
        )
      : patients;
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

  /** GET /api/patients/{id} */
  async getById(id: ID): Promise<Patient | null> {
    if (isLive('patients')) return api.get<Patient>(ENDPOINTS.patient(id)).catch(() => null);
    await delay(140);
    return patientById.get(id) ?? null;
  },

  /** The signed-in patient. Replace with the /api/me response once auth lands. */
  async current(): Promise<Patient> {
    if (isLive('patients')) return api.get<Patient>('/me');
    await delay(80);
    return patientById.get(CURRENT_PATIENT_ID)!;
  },

  /** Patients a given practitioner has actually seen, with visit summaries. */
  async forPsychologist(psychologistId: ID) {
    if (isLive('patients')) {
      return api.get<
        (Patient & { sessionCount: number; lastSessionAt?: string; nextSessionAt?: string })[]
      >(`/psychologists/${psychologistId}/patients`);
    }
    await delay(200);

    const now = new Date();
    const byPatient = new Map<string, typeof appointments>();
    for (const a of appointments) {
      if (a.psychologistId !== psychologistId) continue;
      const list = byPatient.get(a.patientId) ?? [];
      list.push(a);
      byPatient.set(a.patientId, list);
    }

    return [...byPatient.entries()]
      .map(([patientId, list]) => {
        const patient = patientById.get(patientId)!;
        const past = list
          .filter((a) => new Date(a.startsAt) < now && a.status === 'completed')
          .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
        const upcoming = list
          .filter((a) => new Date(a.startsAt) >= now && a.status === 'confirmed')
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        return {
          ...patient,
          sessionCount: past.length,
          lastSessionAt: past[0]?.startsAt,
          nextSessionAt: upcoming[0]?.startsAt,
        };
      })
      .sort((a, b) => (b.lastSessionAt ?? '').localeCompare(a.lastSessionAt ?? ''));
  },

  /** Psychologists the patient has favourited. */
  async favorites(patientId: ID): Promise<Psychologist[]> {
    if (isLive('patients')) return api.get<Psychologist[]>(`${ENDPOINTS.patient(patientId)}/favorites`);
    await delay(160);
    const patient = patientById.get(patientId);
    if (!patient) return [];
    return patient.favoritePsychologistIds
      .map((id) => psychologistById.get(id))
      .filter((p): p is Psychologist => Boolean(p));
  },

  async toggleFavorite(patientId: ID, psychologistId: ID): Promise<boolean> {
    if (isLive('patients')) {
      const res = await api.post<{ favorited: boolean }>(
        `${ENDPOINTS.patient(patientId)}/favorites`,
        { psychologist_id: psychologistId },
      );
      return res.favorited;
    }
    await delay(180);
    const patient = patientById.get(patientId);
    if (!patient) return false;
    const index = patient.favoritePsychologistIds.indexOf(psychologistId);
    if (index >= 0) {
      patient.favoritePsychologistIds.splice(index, 1);
      return false;
    }
    patient.favoritePsychologistIds.push(psychologistId);
    return true;
  },

  async stats(patientId: ID): Promise<PatientStats> {
    if (isLive('patients')) return api.get<PatientStats>(`${ENDPOINTS.patient(patientId)}/stats`);
    await delay(150);

    const now = new Date();
    const mine = appointments.filter((a) => a.patientId === patientId);
    const patient = patientById.get(patientId);

    return {
      upcomingCount: mine.filter((a) => new Date(a.startsAt) >= now && a.status === 'confirmed')
        .length,
      completedCount: mine.filter((a) => a.status === 'completed').length,
      totalSpent: payments
        .filter((p) => p.patientId === patientId && p.status === 'payment_confirmed')
        .reduce((sum, p) => sum + p.amount, 0),
      currency: 'MAD',
      favoriteCount: patient?.favoritePsychologistIds.length ?? 0,
    };
  },
};
