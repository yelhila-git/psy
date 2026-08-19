import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, BadgeCheck, Clock, Landmark, Wallet } from 'lucide-react';
import { paymentService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { acceptsBookings } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { PaymentConfirmationList } from '@/components/payment/payment-confirmation-list';

export const metadata: Metadata = { title: 'Paiements à confirmer' };

export default async function PsychologistPaymentsPage() {
  const [toConfirm, confirmed, pending, paymentInfo] = await Promise.all([
    paymentService.list({
      psychologistId: CURRENT_PSYCHOLOGIST_ID,
      status: ['payment_proof_submitted'],
      perPage: 50,
    }),
    paymentService.list({
      psychologistId: CURRENT_PSYCHOLOGIST_ID,
      status: ['payment_confirmed'],
      perPage: 200,
    }),
    paymentService.list({
      psychologistId: CURRENT_PSYCHOLOGIST_ID,
      status: ['payment_pending'],
      perPage: 50,
    }),
    paymentService.paymentInfo(CURRENT_PSYCHOLOGIST_ID),
  ]);

  const collected = confirmed.data.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Paiements à confirmer"
        description="Vérifiez la réception de chaque transfert avant de confirmer le rendez-vous."
        action={
          <Button variant="outline-muted" asChild>
            <Link href="/dashboard/psychologist/payment-info">
              <Landmark />
              Mes informations de paiement
            </Link>
          </Button>
        }
      />

      {!acceptsBookings(paymentInfo) && (
        <Card className="mb-6 border-warning/40 bg-warning-soft/50 p-5">
          <p className="flex items-start gap-2.5 text-base font-semibold text-secondary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            Vos informations de paiement ne sont pas actives
          </p>
          <p className="ms-7 mt-1 text-base leading-relaxed text-muted-foreground">
            Tant qu’aucune coordonnée n’est publiée, les patients ne peuvent pas réserver de
            consultation avec vous.
          </p>
          <Button size="sm" className="ms-7 mt-3" asChild>
            <Link href="/dashboard/psychologist/payment-info">Compléter mes coordonnées</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardCard
          label="À confirmer"
          value={toConfirm.meta.total}
          icon={Clock}
          tone={toConfirm.meta.total > 0 ? 'warning' : 'success'}
          hint="transferts déclarés par vos patients"
        />
        <DashboardCard
          label="En attente de transfert"
          value={pending.meta.total}
          icon={Landmark}
          tone="navy"
          hint="réservations non encore réglées"
        />
        <DashboardCard
          label="Total encaissé en direct"
          value={formatPrice(collected)}
          icon={Wallet}
          tone="success"
          hint={`${confirmed.meta.total} paiements confirmés`}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-md font-bold text-secondary">
          <BadgeCheck className="size-4 text-primary" aria-hidden />
          En attente de votre confirmation
        </h2>

        <PaymentConfirmationList
          payments={toConfirm.data}
          psychologistId={CURRENT_PSYCHOLOGIST_ID}
        />
      </section>
    </>
  );
}
