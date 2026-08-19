import type { Metadata } from 'next';
import { PsychologistOnboarding } from '@/components/onboarding/psychologist-onboarding';

export const metadata: Metadata = {
  title: 'Devenir psychologue partenaire',
  description:
    'Créez votre profil praticien sur AlloMonPsy : informations professionnelles, vérification des diplômes, tarifs et disponibilités.',
};

export default function PsychologistRegisterPage() {
  return <PsychologistOnboarding />;
}
