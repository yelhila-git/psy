import type {
  AvailabilityRule,
  Education,
  ExperienceItem,
  Psychologist,
  VerificationDocument,
} from '@/types';
import { slugify } from '@/lib/utils';
import { addDays, atTime, avatar, createRng, int, iso, pickMany, startOfToday } from './seed';

type Blueprint = {
  first: string;
  last: string;
  gender: 'male' | 'female';
  title: string;
  headline: string;
  city: string;
  specialties: Psychologist['specialties'];
  approaches: Psychologist['approaches'];
  languages: Psychologist['languages'];
  years: number;
  price: number; // centimes
  rating: number;
  reviews: number;
  avatarId: number;
  status?: Psychologist['verificationStatus'];
  accepting?: boolean;
};

/**
 * 20 practitioners with distinct, non-interchangeable positioning — the point
 * of a marketplace is that filtering actually narrows things down, so the
 * distribution of price, language, gender and specialty is deliberate.
 */
const BLUEPRINTS: Blueprint[] = [
  {
    first: 'Chaimaa',
    last: 'Hamouch',
    gender: 'female',
    title: 'Psychologue clinicienne',
    headline: "Accompagnement de l'anxiété et des relations toxiques",
    city: 'Casablanca',
    specialties: ['anxiety', 'stress', 'self-esteem'],
    approaches: ['cbt', 'mindfulness'],
    languages: ['fr', 'ar', 'ary'],
    years: 9,
    price: 45000,
    rating: 4.9,
    reviews: 128,
    avatarId: 45,
  },
  {
    first: 'Youssef',
    last: 'El Amrani',
    gender: 'male',
    title: 'Psychothérapeute',
    headline: 'Burn-out et souffrance au travail',
    city: 'Rabat',
    specialties: ['work', 'stress', 'depression'],
    approaches: ['cbt', 'act'],
    languages: ['fr', 'ar', 'en'],
    years: 12,
    price: 55000,
    rating: 4.8,
    reviews: 96,
    avatarId: 12,
  },
  {
    first: 'Sofia',
    last: 'Benali',
    gender: 'female',
    title: 'Psychologue du couple',
    headline: 'Thérapie de couple et médiation familiale',
    city: 'Marrakech',
    specialties: ['couple', 'family', 'grief'],
    approaches: ['systemic', 'humanist'],
    languages: ['fr', 'ary', 'es'],
    years: 15,
    price: 65000,
    rating: 4.9,
    reviews: 174,
    avatarId: 47,
  },
  {
    first: 'Mehdi',
    last: 'Tazi',
    gender: 'male',
    title: 'Psychologue clinicien',
    headline: 'Trauma, EMDR et stress post-traumatique',
    city: 'Casablanca',
    specialties: ['trauma', 'anxiety', 'sleep'],
    approaches: ['emdr', 'cbt'],
    languages: ['fr', 'ar'],
    years: 11,
    price: 60000,
    rating: 4.7,
    reviews: 83,
    avatarId: 33,
  },
  {
    first: 'Nadia',
    last: 'Berrada',
    gender: 'female',
    title: "Psychologue de l'enfant",
    headline: "Troubles de l'apprentissage et accompagnement parental",
    city: 'Fès',
    specialties: ['child', 'adolescent', 'family'],
    approaches: ['systemic', 'humanist'],
    languages: ['fr', 'ar', 'ary'],
    years: 8,
    price: 40000,
    rating: 4.8,
    reviews: 112,
    avatarId: 26,
  },
  {
    first: 'Karim',
    last: 'Ouazzani',
    gender: 'male',
    title: 'Psychologue clinicien',
    headline: 'Addictions et prévention de la rechute',
    city: 'Tanger',
    specialties: ['addiction', 'depression', 'self-esteem'],
    approaches: ['cbt', 'act'],
    languages: ['fr', 'ary', 'en'],
    years: 14,
    price: 50000,
    rating: 4.6,
    reviews: 67,
    avatarId: 15,
  },
  {
    first: 'Leila',
    last: 'Fassi',
    gender: 'female',
    title: 'Psychothérapeute',
    headline: 'Dépression et reconstruction après une rupture',
    city: 'Rabat',
    specialties: ['depression', 'grief', 'self-esteem'],
    approaches: ['humanist', 'psychoanalysis'],
    languages: ['fr', 'ar'],
    years: 7,
    price: 38000,
    rating: 4.7,
    reviews: 91,
    avatarId: 32,
  },
  {
    first: 'Omar',
    last: 'Chraibi',
    gender: 'male',
    title: 'Psychologue du sport et de la performance',
    headline: 'Gestion du stress et confiance en soi',
    city: 'Casablanca',
    specialties: ['stress', 'self-esteem', 'anxiety'],
    approaches: ['cbt', 'mindfulness'],
    languages: ['fr', 'en'],
    years: 6,
    price: 42000,
    rating: 4.5,
    reviews: 44,
    avatarId: 51,
  },
  {
    first: 'Imane',
    last: 'Sekkat',
    gender: 'female',
    title: 'Psychologue clinicienne',
    headline: 'Troubles du comportement alimentaire',
    city: 'Marrakech',
    specialties: ['eating', 'self-esteem', 'anxiety'],
    approaches: ['cbt', 'act'],
    languages: ['fr', 'ar', 'en'],
    years: 10,
    price: 52000,
    rating: 4.9,
    reviews: 138,
    avatarId: 44,
  },
  {
    first: 'Rachid',
    last: 'Bennani',
    gender: 'male',
    title: 'Psychanalyste',
    headline: 'Analyse au long cours et quête de sens',
    city: 'Rabat',
    specialties: ['depression', 'anxiety', 'grief'],
    approaches: ['psychoanalysis'],
    languages: ['fr', 'ar'],
    years: 22,
    price: 75000,
    rating: 4.8,
    reviews: 205,
    avatarId: 60,
  },
  {
    first: 'Salma',
    last: 'Idrissi',
    gender: 'female',
    title: 'Psychologue clinicienne',
    headline: 'Adolescents, harcèlement scolaire et anxiété sociale',
    city: 'Casablanca',
    specialties: ['adolescent', 'anxiety', 'self-esteem'],
    approaches: ['cbt', 'systemic'],
    languages: ['fr', 'ary', 'en'],
    years: 5,
    price: 35000,
    rating: 4.7,
    reviews: 58,
    avatarId: 49,
  },
  {
    first: 'Hicham',
    last: 'Lahlou',
    gender: 'male',
    title: 'Psychothérapeute',
    headline: 'Troubles du sommeil et hygiène mentale',
    city: 'Agadir',
    specialties: ['sleep', 'stress', 'anxiety'],
    approaches: ['cbt', 'mindfulness'],
    languages: ['fr', 'ar', 'ber'],
    years: 9,
    price: 44000,
    rating: 4.6,
    reviews: 72,
    avatarId: 13,
  },
  {
    first: 'Amina',
    last: 'Zouiten',
    gender: 'female',
    title: 'Psychologue périnatale',
    headline: 'Maternité, post-partum et transition parentale',
    city: 'Rabat',
    specialties: ['depression', 'family', 'stress'],
    approaches: ['humanist', 'systemic'],
    languages: ['fr', 'ar', 'ary'],
    years: 13,
    price: 58000,
    rating: 4.9,
    reviews: 156,
    avatarId: 5,
  },
  {
    first: 'Anas',
    last: 'Filali',
    gender: 'male',
    title: 'Psychologue clinicien',
    headline: 'Phobies, TOC et thérapies brèves',
    city: 'Meknès',
    specialties: ['anxiety', 'trauma', 'stress'],
    approaches: ['cbt', 'emdr'],
    languages: ['fr', 'ar'],
    years: 4,
    price: 32000,
    rating: 4.4,
    reviews: 29,
    avatarId: 68,
  },
  {
    first: 'Zineb',
    last: 'Alaoui',
    gender: 'female',
    title: 'Psychothérapeute systémique',
    headline: 'Conflits familiaux et recomposition',
    city: 'Casablanca',
    specialties: ['family', 'couple', 'adolescent'],
    approaches: ['systemic', 'humanist'],
    languages: ['fr', 'ary', 'es'],
    years: 17,
    price: 68000,
    rating: 4.8,
    reviews: 189,
    avatarId: 20,
  },
  {
    first: 'Tarik',
    last: 'Belmekki',
    gender: 'male',
    title: 'Psychologue clinicien',
    headline: 'Deuil, accompagnement de fin de vie',
    city: 'Oujda',
    specialties: ['grief', 'depression', 'trauma'],
    approaches: ['humanist', 'act'],
    languages: ['fr', 'ar', 'ber'],
    years: 16,
    price: 48000,
    rating: 4.7,
    reviews: 101,
    avatarId: 8,
  },
  {
    first: 'Hind',
    last: 'Cherkaoui',
    gender: 'female',
    title: 'Psychologue clinicienne',
    headline: 'Anxiété généralisée et pleine conscience',
    city: 'Tétouan',
    specialties: ['anxiety', 'stress', 'sleep'],
    approaches: ['mindfulness', 'cbt'],
    languages: ['fr', 'ar', 'en'],
    years: 6,
    price: 36000,
    rating: 4.6,
    reviews: 53,
    avatarId: 24,
  },
  {
    first: 'Adil',
    last: 'Mansouri',
    gender: 'male',
    title: 'Psychothérapeute',
    headline: 'Estime de soi et transitions de vie',
    city: 'Casablanca',
    specialties: ['self-esteem', 'work', 'depression'],
    approaches: ['act', 'humanist'],
    languages: ['fr', 'en'],
    years: 8,
    price: 46000,
    rating: 4.5,
    reviews: 61,
    avatarId: 59,
  },
  {
    first: 'Ghita',
    last: 'Naciri',
    gender: 'female',
    title: 'Psychologue clinicienne',
    headline: 'Jeunes adultes, orientation et anxiété de performance',
    city: 'Rabat',
    specialties: ['adolescent', 'anxiety', 'work'],
    approaches: ['cbt', 'act'],
    languages: ['fr', 'ar', 'en'],
    years: 3,
    price: 28000,
    rating: 4.3,
    reviews: 18,
    avatarId: 41,
    status: 'pending',
    accepting: true,
  },
  {
    first: 'Nabil',
    last: 'Squalli',
    gender: 'male',
    title: 'Psychologue clinicien',
    headline: 'Thérapie brève orientée solution',
    city: 'Kénitra',
    specialties: ['stress', 'couple', 'self-esteem'],
    approaches: ['systemic', 'cbt'],
    languages: ['fr', 'ary'],
    years: 2,
    price: 26000,
    rating: 4.2,
    reviews: 11,
    avatarId: 65,
    status: 'pending',
  },
];

const INSTITUTIONS = [
  'Université Mohammed V, Rabat',
  'Université Hassan II, Casablanca',
  'Université Paris Cité',
  'Université Cadi Ayyad, Marrakech',
  'Université Libre de Bruxelles',
  'Université Lyon 2',
];

const ORGS = [
  'Centre Hospitalier Ibn Rochd',
  'Clinique Al Madina',
  'Cabinet privé',
  'Centre de santé mentale de Rabat',
  'Association Amal pour la santé mentale',
  'Hôpital Arrazi, Salé',
];

function buildEducation(bp: Blueprint, r: () => number): Education[] {
  const gradYear = 2026 - bp.years;
  const out: Education[] = [
    {
      id: `edu-${bp.last}-1`,
      degree: 'Master en psychologie clinique et psychopathologie',
      institution: INSTITUTIONS[int(0, INSTITUTIONS.length - 1, r)]!,
      year: gradYear,
    },
    {
      id: `edu-${bp.last}-2`,
      degree: 'Licence en psychologie',
      institution: INSTITUTIONS[int(0, INSTITUTIONS.length - 1, r)]!,
      year: gradYear - 2,
    },
  ];
  if (bp.years >= 8) {
    out.unshift({
      id: `edu-${bp.last}-0`,
      degree:
        bp.approaches[0] === 'emdr'
          ? 'Certification EMDR Europe — praticien accrédité'
          : bp.approaches[0] === 'psychoanalysis'
            ? 'Formation analytique, Société Psychanalytique'
            : 'Diplôme universitaire de thérapie cognitivo-comportementale',
      institution: INSTITUTIONS[int(0, INSTITUTIONS.length - 1, r)]!,
      year: gradYear + 3,
    });
  }
  return out;
}

function buildExperience(bp: Blueprint, r: () => number): ExperienceItem[] {
  const startYear = 2026 - bp.years;
  const items: ExperienceItem[] = [
    {
      id: `exp-${bp.last}-1`,
      role: bp.title,
      organization: 'Cabinet privé — consultations en ligne',
      startYear: startYear + Math.floor(bp.years / 2),
      description:
        'Suivi individuel en téléconsultation, accompagnement au long cours et thérapies brèves.',
    },
    {
      id: `exp-${bp.last}-2`,
      role: 'Psychologue clinicien·ne',
      organization: ORGS[int(0, ORGS.length - 1, r)]!,
      startYear,
      endYear: startYear + Math.floor(bp.years / 2),
      description: 'Prise en charge en service hospitalier, évaluations et suivis thérapeutiques.',
    },
  ];
  return items;
}

const hhmm = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

function buildAvailability(bp: Blueprint, r: () => number): AvailabilityRule[] {
  const rules: AvailabilityRule[] = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    // Sunday off for everyone; Saturday only for roughly half the practitioners.
    const enabled = weekday === 0 ? false : weekday === 6 ? r() > 0.5 : true;

    // Saturdays are a single short morning; weekdays are split around lunch,
    // which is what the multi-block model exists to express.
    const blocks: [number, number][] = !enabled
      ? []
      : weekday === 6
        ? [[10, 13]]
        : [
            [int(8, 10, r), 12],
            [14, int(17, 20, r)],
          ];

    rules.push({
      id: `avail-${bp.last}-${weekday}`,
      weekday: weekday as AvailabilityRule['weekday'],
      enabled,
      ranges: blocks.map(([start, end], i) => ({
        id: `avail-${bp.last}-${weekday}-${i}`,
        startTime: hhmm(start),
        endTime: hhmm(end),
      })),
    });
  }
  return rules;
}

function buildDocuments(bp: Blueprint, submittedAt: Date): VerificationDocument[] {
  const status = bp.status ?? 'approved';
  const docStatus = status === 'approved' ? 'approved' : 'pending';
  return [
    {
      id: `doc-${bp.last}-1`,
      type: 'diploma',
      fileName: `diplome-master-${bp.last.toLowerCase()}.pdf`,
      uploadedAt: iso(submittedAt),
      status: docStatus,
    },
    {
      id: `doc-${bp.last}-2`,
      type: 'license',
      fileName: `autorisation-exercice-${bp.last.toLowerCase()}.pdf`,
      uploadedAt: iso(submittedAt),
      status: docStatus,
    },
    {
      id: `doc-${bp.last}-3`,
      type: 'identity',
      fileName: `cin-${bp.last.toLowerCase()}.jpg`,
      uploadedAt: iso(submittedAt),
      status: docStatus,
    },
  ];
}

function buildBio(bp: Blueprint): string {
  return [
    `Je suis ${bp.title.toLowerCase()} et j'accompagne depuis ${bp.years} ans des adultes qui traversent une période difficile. Mon travail commence toujours par la même chose : comprendre ce que vous vivez, sans jugement et à votre rythme.`,
    `Ma pratique s'appuie sur ${bp.approaches.length > 1 ? 'plusieurs approches complémentaires' : 'une approche structurée'}, que j'adapte à votre situation plutôt que l'inverse. Concrètement, nous définissons ensemble un objectif clair dès les premières séances, puis nous avançons par étapes en vérifiant régulièrement ce qui fonctionne pour vous.`,
    `Les consultations se déroulent en visioconférence, dans un cadre strictement confidentiel. Une première séance suffit généralement pour savoir si le courant passe — et c'est la condition la plus importante d'une thérapie qui aboutit.`,
  ].join('\n\n');
}

export const psychologists: Psychologist[] = BLUEPRINTS.map((bp, index) => {
  const r = createRng(1000 + index * 37);
  const today = startOfToday();
  const status = bp.status ?? 'approved';
  const isApproved = status === 'approved';
  const submittedAt = addDays(today, -(int(40, 400, r) + index));
  const approvedAt = addDays(submittedAt, int(2, 9, r));

  // Next free slot: approved & accepting practitioners surface sooner.
  const daysOut = isApproved ? int(0, 6, r) : int(3, 12, r);
  const nextAvailable = atTime(addDays(today, daysOut), int(9, 17, r), r() > 0.5 ? 30 : 0);

  const id = `psy-${String(index + 1).padStart(3, '0')}`;
  const fullName = `${bp.first} ${bp.last}`;

  return {
    id,
    role: 'psychologist',
    // slugify handles accents and multi-word surnames ("El Amrani" -> el-amrani).
    slug: slugify(`${bp.first} ${bp.last}`),
    firstName: bp.first,
    lastName: bp.last,
    fullName,
    email: `${bp.first.toLowerCase()}.${bp.last.toLowerCase()}@allomonpsy.com`,
    phone: `+212 6 ${int(10, 99, r)} ${int(10, 99, r)} ${int(10, 99, r)} ${int(10, 99, r)}`,
    avatarUrl: avatar(bp.avatarId),
    locale: 'fr',
    createdAt: iso(submittedAt),
    gender: bp.gender,
    title: bp.title,
    headline: bp.headline,
    bio: buildBio(bp),
    introVideoUrl:
      isApproved && r() > 0.4
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        : undefined,
    specialties: bp.specialties,
    approaches: bp.approaches,
    languages: bp.languages,
    yearsOfExperience: bp.years,
    education: buildEducation(bp, r),
    experience: buildExperience(bp, r),
    city: bp.city,
    pricePerHour: bp.price,
    currency: 'MAD',
    rating: bp.rating,
    reviewCount: bp.reviews,
    patientCount: bp.reviews * 2 + int(5, 40, r),
    verificationStatus: status,
    isVerified: isApproved,
    acceptsNewPatients: bp.accepting ?? r() > 0.15,
    modes: r() > 0.7 ? ['video', 'audio'] : ['video', 'audio', 'chat'],
    nextAvailableAt: isApproved ? iso(nextAvailable) : undefined,
    responseTimeMinutes: int(15, 240, r),
    availability: buildAvailability(bp, r),
    documents: buildDocuments(bp, submittedAt),
    submittedAt: iso(submittedAt),
    approvedAt: isApproved ? iso(approvedAt) : undefined,
    profileCompletion: isApproved ? int(88, 100, r) : int(55, 80, r),
  } satisfies Psychologist;
});

export const psychologistById = new Map(psychologists.map((p) => [p.id, p]));
export const psychologistBySlug = new Map(psychologists.map((p) => [p.slug, p]));

/** Resolves either a slug or an id — profile URLs accept both. */
export function findPsychologist(idOrSlug: string): Psychologist | undefined {
  return psychologistById.get(idOrSlug) ?? psychologistBySlug.get(idOrSlug);
}

export { pickMany };
