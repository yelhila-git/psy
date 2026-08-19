import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, Landmark, Receipt } from 'lucide-react';
import { paymentService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { TRANSFER_METHOD_LABELS } from '@/lib/constants';
import { formatDate, formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';

export const metadata: Metadata = { title: 'Paiements' };

const HEADERS = ['Référence', 'Psychologue', 'Date', 'Méthode', 'Montant', 'Statut', ''];

export default async function PatientPaymentsPage() {
  const payments = await paymentService.list({ patientId: CURRENT_PATIENT_ID, perPage: 50 });

  const confirmed = payments.data.filter((p) => p.status === 'payment_confirmed');
  const totalPaid = confirmed.reduce((sum, p) => sum + p.amount, 0);
  const awaiting = payments.data.filter(
    (p) => p.status === 'payment_pending' || p.status === 'payment_proof_submitted',
  ).length;

  return (
    <>
      <PageHeader
        title="Paiements"
        description="Vos transferts aux psychologues et leur état de confirmation."
      />

      {payments.data.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucun paiement"
          description="Vos règlements apparaîtront ici après votre première réservation."
          action={{ label: 'Trouver un psychologue', href: '/psychologists' }}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <DashboardCard
              label="Total réglé"
              value={formatPrice(totalPaid)}
              icon={CheckCircle2}
              tone="success"
              hint={`${confirmed.length} paiements confirmés`}
            />
            <DashboardCard
              label="En cours"
              value={awaiting}
              icon={Clock}
              tone={awaiting > 0 ? 'warning' : 'navy'}
              hint="transferts à faire ou à confirmer"
            />
            <DashboardCard
              label="Transactions"
              value={payments.meta.total}
              icon={Landmark}
              tone="navy"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-start">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {HEADERS.map((header, i) => (
                      <th
                        key={header || `actions-${i}`}
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
                    const actionable =
                      payment.status === 'payment_pending' ||
                      payment.status === 'payment_rejected' ||
                      payment.status === 'payment_proof_submitted';

                    return (
                      <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-base font-medium text-secondary">
                          {payment.reference}
                        </td>
                        <td className="px-5 py-4 text-base text-muted-foreground">
                          {payment.psychologist.fullName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                          {formatDate(payment.appointment.startsAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                          {payment.method ? TRANSFER_METHOD_LABELS[payment.method] : '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base font-bold text-secondary">
                          {formatPrice(payment.amount, payment.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge kind="payment" status={payment.status} size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-end">
                          {actionable && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/payment/${payment.appointmentId}`}>
                                {payment.status === 'payment_proof_submitted' ? 'Suivre' : 'Régler'}
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
