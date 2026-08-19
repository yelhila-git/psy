import type { Metadata } from 'next';
import { paymentService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { PaymentInfoForm } from '@/components/payment/payment-info-form';

export const metadata: Metadata = { title: 'Mes informations de paiement' };

export default async function PaymentInfoPage() {
  const info = await paymentService.paymentInfo(CURRENT_PSYCHOLOGIST_ID);

  return (
    <>
      <PageHeader
        title="Mes informations de paiement"
        description="Les coordonnées que vos patients utiliseront pour vous régler directement."
      />
      <PaymentInfoForm psychologistId={CURRENT_PSYCHOLOGIST_ID} initial={info} />
    </>
  );
}
