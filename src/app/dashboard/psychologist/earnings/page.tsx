import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Gift, Info, TrendingUp, Wallet } from 'lucide-react';
import { paymentService, psychologistService, subscriptionService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { appointmentById } from '@/lib/mock/appointments';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard, TrendChart } from '@/components/dashboard/dashboard-card';

export const metadata: Metadata = { title: 'Revenus' };

export default async function EarningsPage() {
  const [stats, payments, subscription] = await Promise.all([
    psychologistService.stats(CURRENT_PSYCHOLOGIST_ID),
    paymentService.list({ psychologistId: CURRENT_PSYCHOLOGIST_ID, perPage: 30 }),
    subscriptionService.forPsychologist(CURRENT_PSYCHOLOGIST_ID),
  ]);

  const confirmed = payments.data.filter((p) => p.status === 'payment_confirmed');
  const collected = confirmed.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Revenus"
        description="Vos patients vous règlent directement. AlloMonPsy ne prélève aucune commission."
        action={
          <Button variant="outline-muted">
            <Download />
            Exporter (CSV)
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Encaissé ce mois"
          value={formatPrice(stats.monthEarnings, stats.currency)}
          icon={Wallet}
          tone="primary"
          hint="reçu directement sur votre compte"
        />
        <DashboardCard
          label="Total encaissé"
          value={formatPrice(collected)}
          icon={TrendingUp}
          tone="navy"
          hint={`${confirmed.length} paiements confirmés`}
        />
        <DashboardCard
          label="Consultations payantes"
          value={stats.paidConsultations}
          icon={Wallet}
          tone="success"
          hint="ce mois-ci"
        />
        <DashboardCard
          label="Premières consultations offertes"
          value={stats.freeConsultations}
          icon={Gift}
          tone="warning"
          hint="ce mois-ci"
        />
      </div>

      <Card className="mt-6 flex items-start gap-3 bg-info-soft/60 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        <p className="text-base leading-relaxed text-muted-foreground">
          Le montant de chaque consultation vous est versé intégralement par le patient. Votre seul
          coût est l’abonnement mensuel
          {subscription ? ` (formule ${subscription.plan.name})` : ''} :{' '}
          <Link
            href="/dashboard/psychologist/subscription"
            className="font-medium text-primary hover:underline"
          >
            gérer mon abonnement
          </Link>
          .
        </p>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-md font-bold text-secondary">Encaissements sur 6 mois</h2>
        <TrendChart
          className="mt-6"
          data={stats.earningsTrend.map((point) => ({ label: point.month, value: point.amount }))}
          format={(value) => formatPrice(value)}
        />
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-md font-bold text-secondary">Détail des consultations payantes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Les premières consultations gratuites ne génèrent aucun paiement et n’apparaissent donc
            pas dans ce tableau.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {['Référence', 'Patient', 'Date', 'Montant', 'Statut'].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-5 py-3 text-start text-2xs font-bold uppercase tracking-wider text-subtle-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.data.map((payment) => {
                const appointment = appointmentById.get(payment.appointmentId);
                return (
                  <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-base font-medium text-secondary">
                      {payment.reference}
                    </td>
                    <td className="px-5 py-4 text-base text-muted-foreground">
                      {payment.patient.fullName}
                      {appointment?.isFirstConsultation && (
                        <Badge variant="success" size="sm" className="ms-2">
                          1re séance
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base font-bold text-success">
                      {payment.status === 'payment_confirmed'
                        ? formatPrice(payment.amount, payment.currency)
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge kind="payment" status={payment.status} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
