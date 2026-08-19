import type { Metadata } from 'next';
import { psychologistService } from '@/lib/services';
import { Hero } from '@/components/home/hero';
import { Therapies } from '@/components/home/therapies';
import { FeaturedPsychologists } from '@/components/home/featured-psychologists';
import { HowItWorks } from '@/components/home/how-it-works';
import { StatsBand, TrustSection } from '@/components/home/trust';
import { FinalCTA } from '@/components/home/final-cta';

export const metadata: Metadata = {
  title: 'Consultations psychologiques en ligne',
  description:
    'Trouvez un psychologue diplômé et consultez en visioconférence. Praticiens vérifiés, créneaux flexibles, échanges confidentiels.',
};

export default async function HomePage() {
  const [featured, specialtyCounts] = await Promise.all([
    psychologistService.featured(6),
    psychologistService.specialtyCounts(),
  ]);

  return (
    <>
      <Hero practitioners={featured} />
      <Therapies counts={specialtyCounts} />
      <FeaturedPsychologists psychologists={featured} />
      <HowItWorks />
      <StatsBand />
      <TrustSection />
      <FinalCTA />
    </>
  );
}
