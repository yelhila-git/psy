import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BadgeCheck,
  CalendarDays,
  Landmark,
  FileCheck2,
  Search,
  UserPlus,
  Video,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/feedback';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Comment ça marche',
  description:
    'Découvrez le fonctionnement d’AlloMonPsy, côté patient comme côté psychologue : recherche, réservation, consultation en visio et paiement.',
};

const PATIENT_STEPS = [
  {
    icon: Search,
    title: 'Cherchez et comparez',
    body: 'Filtrez par motif de consultation, langue, tarif, genre du praticien ou disponibilité. Chaque fiche détaille le parcours, les diplômes et les avis vérifiés.',
  },
  {
    icon: CalendarDays,
    title: 'Réservez un créneau',
    body: 'L’agenda affiche les disponibilités réelles du praticien. Choisissez la durée qui vous convient — 30, 45, 60 ou 90 minutes.',
  },
  {
    icon: Landmark,
    title: 'Réglez par transfert instantané',
    body: 'Vous recevez le numéro du psychologue et lui envoyez le montant par transfert instantané. Il confirme la réception, et votre consultation est débloquée.',
  },
  {
    icon: Video,
    title: 'Consultez en visio',
    body: 'Rejoignez la salle depuis votre navigateur, sans installation. La séance est chiffrée et n’est jamais enregistrée.',
  },
];

const PSY_STEPS = [
  {
    icon: UserPlus,
    title: 'Créez votre compte',
    body: 'Renseignez vos informations personnelles et professionnelles en quelques minutes. Vous pouvez sauvegarder et reprendre plus tard.',
  },
  {
    icon: FileCheck2,
    title: 'Faites vérifier votre profil',
    body: 'Déposez votre diplôme, votre autorisation d’exercice et une pièce d’identité. Notre équipe vérifie sous 48 à 72 heures ouvrées.',
  },
  {
    icon: Wallet,
    title: 'Fixez tarif et disponibilités',
    body: 'Vous définissez librement le prix de vos séances et vos plages horaires. Vous restez maître de votre agenda.',
  },
  {
    icon: BadgeCheck,
    title: 'Recevez vos patients',
    body: `Les demandes arrivent directement dans votre tableau de bord et vos patients vous règlent en direct. Aucune commission : vous payez seulement un abonnement mensuel, gratuit jusqu’à ${SUBSCRIPTION_PLANS[0]!.monthlyQuota} consultations puis à partir de ${formatPrice(SUBSCRIPTION_PLANS[1]!.pricePerMonth)}.`,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-border bg-surface-alt">
        <div className="container-page py-14 lg:py-20">
          <p className="eyebrow">Comment ça marche</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-secondary sm:text-5xl">
            Un parcours simple, de la recherche à la séance
          </h1>
          <p className="mt-5 max-w-2xl text-md leading-relaxed text-muted-foreground">
            AlloMonPsy met en relation des patients et des psychologues diplômés pour des
            consultations en visioconférence. Voici comment cela fonctionne des deux côtés.
          </p>
        </div>
      </section>

      <section className="py-section-sm lg:py-section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Côté patient"
            title="Consulter en quatre étapes"
            description="Aucune inscription n’est requise pour parcourir les profils. Vous ne créez un compte qu’au moment de réserver."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PATIENT_STEPS.map(({ icon: Icon, title, body }, i) => (
              <Card key={title} className="relative p-6">
                <span className="absolute end-5 top-5 text-4xl font-black text-primary-soft">
                  0{i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-card bg-primary-soft text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-md font-bold text-secondary">{title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/psychologists">Trouver un psychologue</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-section-sm lg:py-section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Côté psychologue"
            title="Rejoindre la plateforme"
            description="Vous exercez et souhaitez développer votre activité en ligne ? L’inscription est gratuite, la commission ne s’applique qu’aux consultations réalisées."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PSY_STEPS.map(({ icon: Icon, title, body }, i) => (
              <Card key={title} className="relative p-6">
                <span className="absolute end-5 top-5 text-4xl font-black text-primary-soft">
                  0{i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-card bg-primary-soft text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-md font-bold text-secondary">{title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/register/psychologist">Créer mon profil praticien</Link>
            </Button>
            <Button size="lg" variant="outline-muted" asChild>
              <Link href="/faq">Consulter la FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
