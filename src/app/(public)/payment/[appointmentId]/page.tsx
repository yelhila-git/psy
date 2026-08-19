'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PaymentScreen } from '@/components/payment/payment-screen';

/**
 * Client component: bookings created during the flow live in the browser's
 * mock store, so this screen has to read them from there. Once Laravel
 * persists bookings and payments this becomes a server component.
 */
export default function PaymentPage() {
  const params = useParams<{ appointmentId: string }>();

  return (
    <div className="bg-surface-alt py-10 lg:py-14">
      <div className="container-page">
        <Link
          href="/dashboard/patient/appointments"
          className="inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4 rtl-flip" />
          Mes rendez-vous
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-secondary">Paiement de votre consultation</h1>
        <p className="mt-2 text-md text-muted-foreground">
          Le règlement se fait par transfert instantané, directement au psychologue.
        </p>

        <div className="mt-8">
          <PaymentScreen appointmentId={params.appointmentId} />
        </div>
      </div>
    </div>
  );
}
