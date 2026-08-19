import type { Patient } from '@/types';
import { addDays, avatar, createRng, int, iso, startOfToday } from './seed';
import { psychologists } from './psychologists';

type PatientBlueprint = {
  first: string;
  last: string;
  gender: 'male' | 'female';
  city: string;
  avatarId: number;
  birthYear: number;
};

const BLUEPRINTS: PatientBlueprint[] = [
  { first: 'Yasmine', last: 'Ouhadi', gender: 'female', city: 'Casablanca', avatarId: 1, birthYear: 1994 },
  { first: 'Reda', last: 'Kabbaj', gender: 'male', city: 'Rabat', avatarId: 3, birthYear: 1988 },
  { first: 'Meryem', last: 'Slaoui', gender: 'female', city: 'Marrakech', avatarId: 9, birthYear: 1999 },
  { first: 'Ilyas', last: 'Rhalib', gender: 'male', city: 'Tanger', avatarId: 11, birthYear: 1991 },
  { first: 'Sara', last: 'Bouzid', gender: 'female', city: 'Casablanca', avatarId: 16, birthYear: 1996 },
  { first: 'Walid', last: 'Amrani', gender: 'male', city: 'Fès', avatarId: 17, birthYear: 1985 },
  { first: 'Khadija', last: 'Moujahid', gender: 'female', city: 'Agadir', avatarId: 21, birthYear: 1979 },
  { first: 'Nizar', last: 'Guerraoui', gender: 'male', city: 'Rabat', avatarId: 52, birthYear: 2001 },
  { first: 'Lina', last: 'Charef', gender: 'female', city: 'Casablanca', avatarId: 25, birthYear: 1993 },
  { first: 'Othmane', last: 'Bahri', gender: 'male', city: 'Oujda', avatarId: 53, birthYear: 1990 },
];

export const patients: Patient[] = BLUEPRINTS.map((bp, index) => {
  const r = createRng(5000 + index * 17);
  const today = startOfToday();
  const joined = addDays(today, -int(20, 500, r));
  const favCount = int(0, 3, r);

  return {
    id: `pat-${String(index + 1).padStart(3, '0')}`,
    role: 'patient',
    firstName: bp.first,
    lastName: bp.last,
    fullName: `${bp.first} ${bp.last}`,
    email: `${bp.first.toLowerCase()}.${bp.last.toLowerCase()}@example.com`,
    phone: `+212 6 ${int(10, 99, r)} ${int(10, 99, r)} ${int(10, 99, r)} ${int(10, 99, r)}`,
    avatarUrl: avatar(bp.avatarId),
    locale: 'fr',
    createdAt: iso(joined),
    gender: bp.gender,
    dateOfBirth: `${bp.birthYear}-${String(int(1, 12, r)).padStart(2, '0')}-${String(int(1, 28, r)).padStart(2, '0')}`,
    city: bp.city,
    favoritePsychologistIds: Array.from({ length: favCount }, (_, i) => {
      const idx = (index * 3 + i * 5) % psychologists.length;
      return psychologists[idx]!.id;
    }),
    appointmentCount: int(1, 14, r),
  } satisfies Patient;
});

export const patientById = new Map(patients.map((p) => [p.id, p]));

/** The signed-in patient used across the demo dashboard. */
export const CURRENT_PATIENT_ID = patients[0]!.id;

/** The signed-in psychologist used across the demo dashboard. */
export const CURRENT_PSYCHOLOGIST_ID = psychologists[0]!.id;
