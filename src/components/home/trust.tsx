import { BadgeCheck, Clock4, HeartHandshake, Languages, Lock, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/feedback';

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Praticiens vérifiés',
    description:
      'Diplôme, autorisation d’exercice et identité sont contrôlés par notre équipe avant toute mise en ligne. Aucun profil non validé n’apparaît dans les résultats.',
  },
  {
    icon: Lock,
    title: 'Confidentialité stricte',
    description:
      'Visioconférence chiffrée de bout en bout, aucun enregistrement, et un secret professionnel qui s’applique exactement comme en cabinet.',
  },
  {
    icon: Languages,
    title: 'Dans votre langue',
    description:
      'Français, arabe, darija, anglais ou amazigh : consultez avec quelqu’un qui comprend vos mots, y compris ceux qui n’ont pas de traduction.',
  },
  {
    icon: Clock4,
    title: 'Des créneaux qui s’adaptent',
    description:
      'Tôt le matin, en soirée ou le samedi. Vous réservez selon votre emploi du temps, pas celui d’un cabinet.',
  },
  {
    icon: Wallet,
    title: 'Tarifs affichés clairement',
    description:
      'Le prix de la séance est visible avant la réservation. Vous réglez le psychologue par transfert instantané, sans frais cachés ni carte bancaire.',
  },
  {
    icon: HeartHandshake,
    title: 'Vous restez libre',
    description:
      'Aucun engagement ni abonnement. Vous changez de praticien quand vous le souhaitez, sans avoir à vous justifier.',
  },
];

export function TrustSection() {
  return (
    <section className="bg-surface-alt py-section-sm lg:py-section">
      <div className="container-page">
        <SectionHeading
          align="center"
          eyebrow="Pourquoi AlloMonPsy"
          title="Un cadre sérieux pour un sujet qui l’est"
          description="Consulter un psychologue demande de la confiance. Voici ce que nous mettons en place pour la mériter."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-6 transition-shadow hover:shadow-card-hover">
              <span className="flex size-12 items-center justify-center rounded-card bg-primary-soft text-primary">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-md font-bold text-secondary">{title}</h3>
              <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The navy statistics band from the Figma ("A healing touch to heal you completely"). */
export function StatsBand() {
  const stats = [
    { value: '2 400+', label: 'Patients accompagnés' },
    { value: '54', label: 'Psychologues vérifiés' },
    { value: '12 800', label: 'Consultations réalisées' },
    { value: '4,8/5', label: 'Satisfaction moyenne' },
  ];

  return (
    <section className="relative overflow-hidden band-navy py-16 lg:py-20">
      <div className="pattern-puzzle absolute inset-0 opacity-60" aria-hidden />

      <div className="container-page relative">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="text-3xl font-bold leading-[1.15] text-white sm:text-4xl">
            Un accompagnement qui tient dans la durée
          </h2>
          <p className="text-md leading-relaxed text-white/70">
            La plupart de nos patients consultent pour la première fois. Ce qui les fait rester,
            c’est la régularité et la qualité du lien avec leur praticien — pas la promesse d’une
            solution rapide.
          </p>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={i > 0 ? 'lg:border-s lg:border-white/20 lg:ps-8' : undefined}
            >
              <dt className="text-xs text-white/60">{stat.label}</dt>
              <dd className="mt-1 text-4xl font-black text-white sm:text-5xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
