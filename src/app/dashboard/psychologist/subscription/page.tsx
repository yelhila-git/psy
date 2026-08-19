import type { Metadata } from 'next';
import { subscriptionService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { SubscriptionPanel } from '@/components/payment/subscription-panel';

export const metadata: Metadata = { title: 'Mon abonnement' };

export default async function SubscriptionPage() {
  const [subscription, plans, invoices] = await Promise.all([
    subscriptionService.forPsychologist(CURRENT_PSYCHOLOGIST_ID),
    subscriptionService.plans(),
    subscriptionService.invoices(CURRENT_PSYCHOLOGIST_ID),
  ]);

  return (
    <>
      <PageHeader
        title="Mon abonnement"
        description="Votre formule mensuelle et le nombre de consultations qu’elle vous ouvre."
      />
      <SubscriptionPanel
        psychologistId={CURRENT_PSYCHOLOGIST_ID}
        initial={subscription}
        plans={plans}
        invoices={invoices}
      />
    </>
  );
}
