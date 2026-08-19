import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { planById, SUBSCRIPTION_PLANS } from '@/lib/constants';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { SubscriptionCheckout } from '@/components/payment/subscription-checkout';

export const metadata: Metadata = { title: 'Paiement de l’abonnement' };

export function generateStaticParams() {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.pricePerMonth > 0).map((plan) => ({
    planId: plan.id,
  }));
}

export default async function SubscriptionCheckoutPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const plan = planById.get(planId as never);

  // The free tier is never paid for, so it has no checkout.
  if (!plan || plan.pricePerMonth === 0) notFound();

  return (
    <>
      <Link
        href="/dashboard/psychologist/subscription"
        className="inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft className="size-4 rtl-flip" />
        Mon abonnement
      </Link>

      <PageHeader
        className="mt-4"
        title={`Passer à la formule ${plan.name}`}
        description="Le paiement est encaissé par AlloMonPsy via CMI. Il ne concerne que votre abonnement, jamais vos consultations."
      />

      <SubscriptionCheckout psychologistId={CURRENT_PSYCHOLOGIST_ID} plan={plan} />
    </>
  );
}
