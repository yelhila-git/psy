import type {
  Language,
  Specialty,
  SubscriptionPlan,
  TherapyApproach,
  TransferMethod,
} from '@/types';

export const SITE = {
  name: 'AlloMonPsy',
  tagline: 'Consultations psychologiques en ligne',
  description:
    "Trouvez le psychologue qui vous correspond et consultez en visio, où que vous soyez. Praticiens vérifiés, créneaux flexibles, échanges strictement confidentiels.",
  email: 'support@allomonpsy.com',
  phone: '+212 6 00 00 00 00',
  address: 'Casablanca, Maroc',
} as const;

/**
 * The platform's entire business model.
 *
 * Practitioners pay a monthly subscription; the platform takes no commission
 * on consultations and never handles a patient's money. Quotas are what
 * separate the tiers, so they are the one number the gating logic reads.
 *
 * Admin-editable at runtime, which is why this is seed data rather than a
 * hardcoded constant in the gating code.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Découverte',
    pricePerMonth: 0,
    currency: 'MAD',
    monthlyQuota: 5,
    tagline: 'Pour tester la plateforme sans engagement',
    features: [
      '5 consultations par mois',
      'Profil public vérifié',
      'Consultations vidéo illimitées en durée',
      'Paiement direct par vos patients',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    pricePerMonth: 19900,
    currency: 'MAD',
    monthlyQuota: 30,
    tagline: 'Pour une activité en ligne régulière',
    features: [
      '30 consultations par mois',
      'Messagerie avec vos patients',
      'Statistiques de votre activité',
      'Support par e-mail',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    pricePerMonth: 39900,
    currency: 'MAD',
    monthlyQuota: 100,
    tagline: 'Pour une pratique à temps plein',
    features: [
      '100 consultations par mois',
      'Mise en avant dans les résultats',
      'Statistiques avancées et export',
      'Support prioritaire',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    pricePerMonth: 69900,
    currency: 'MAD',
    monthlyQuota: null,
    tagline: 'Sans limite, pour les cabinets les plus actifs',
    features: [
      'Consultations illimitées',
      'Mise en avant maximale',
      'Statistiques avancées et export',
      'Accompagnement dédié',
    ],
  },
];

export const planById = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan]));

/**
 * How long a patient has to declare their transfer before the booking is
 * released. Admin-configurable from /admin/settings.
 */
export const PAYMENT_WINDOW_MINUTES = 30;

export const PAYMENT_WINDOW_OPTIONS = [15, 30, 45, 60, 120] as const;

/**
 * The single transfer method the platform supports. Patients are not asked to
 * choose — there is nothing to choose between.
 */
export const DEFAULT_TRANSFER_METHOD: TransferMethod = 'instant_transfer';

export const TRANSFER_METHOD_LABELS: Record<TransferMethod, string> = {
  instant_transfer: 'Transfert instantané',
};

export const TRANSFER_METHOD_HINT =
  'Wafacash, Cash Plus, Barid Cash ou transfert mobile, vers le numéro du psychologue';

/** Banks a Moroccan practitioner is likely to hold an account with. */
export const MOROCCAN_BANKS = [
  'Attijariwafa Bank',
  'Banque Populaire',
  'Bank of Africa — BMCE',
  'CIH Bank',
  'Crédit du Maroc',
  'Société Générale Maroc',
  'Al Barid Bank',
  'Bank Assafa',
  'Umnia Bank',
  'CFG Bank',
  'Crédit Agricole du Maroc',
  'Arab Bank Maroc',
] as const;

export const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'anxiety', label: 'Troubles anxieux' },
  { value: 'depression', label: 'Dépression' },
  { value: 'stress', label: 'Stress & burn-out' },
  { value: 'couple', label: 'Thérapie de couple' },
  { value: 'family', label: 'Thérapie familiale' },
  { value: 'child', label: "Psychologie de l'enfant" },
  { value: 'adolescent', label: 'Adolescents' },
  { value: 'trauma', label: 'Trauma & TSPT' },
  { value: 'addiction', label: 'Addictions' },
  { value: 'eating', label: 'Troubles alimentaires' },
  { value: 'sleep', label: 'Troubles du sommeil' },
  { value: 'grief', label: 'Deuil & séparation' },
  { value: 'self-esteem', label: 'Confiance en soi' },
  { value: 'work', label: 'Souffrance au travail' },
];

export const APPROACHES: { value: TherapyApproach; label: string }[] = [
  { value: 'cbt', label: 'Thérapie cognitivo-comportementale (TCC)' },
  { value: 'psychoanalysis', label: 'Psychanalyse' },
  { value: 'systemic', label: 'Approche systémique' },
  { value: 'emdr', label: 'EMDR' },
  { value: 'humanist', label: 'Approche humaniste' },
  { value: 'mindfulness', label: 'Pleine conscience' },
  { value: 'act', label: "Thérapie d'acceptation et d'engagement" },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'Arabe' },
  { value: 'ary', label: 'Darija' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'ber', label: 'Amazigh' },
];

export const CONSULTATION_DURATIONS = [30, 45, 60, 90] as const;

export const PRICE_RANGE = { min: 0, max: 90000 } as const; // centimes

export const EXPERIENCE_BUCKETS = [
  { value: '0-2', label: 'Moins de 3 ans', min: 0, max: 2 },
  { value: '3-5', label: '3 à 5 ans', min: 3, max: 5 },
  { value: '6-10', label: '6 à 10 ans', min: 6, max: 10 },
  { value: '10+', label: 'Plus de 10 ans', min: 10, max: 100 },
] as const;

export const MAIN_NAV = [
  { label: 'Thérapie en ligne', href: '/psychologists' },
  { label: 'Comment ça marche', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
] as const;

export const FOOTER_NAV = {
  company: {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/how-it-works' },
      { label: 'Nos psychologues', href: '/psychologists' },
      { label: 'Devenir psychologue', href: '/register/psychologist' },
      { label: 'Carrières', href: '/how-it-works' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Centre d’aide', href: '/faq' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Nous contacter', href: '/faq' },
      { label: 'Urgences', href: '/faq' },
    ],
  },
  legal: {
    title: 'Légal',
    links: [
      { label: 'Confidentialité', href: '/faq' },
      { label: "Conditions d'utilisation", href: '/faq' },
      { label: 'Déontologie', href: '/faq' },
      { label: 'Cookies', href: '/faq' },
    ],
  },
} as const;

/** Non-clinical emergency notice shown in the footer and the FAQ. */
export const EMERGENCY_NOTICE =
  "AlloMonPsy n'est pas un service d'urgence. En cas de danger immédiat, contactez les secours (141) ou rendez-vous aux urgences les plus proches.";
