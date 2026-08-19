'use client';

import * as React from 'react';
import { CheckCircle2, Clock, History, Info, Landmark, SearchX, XCircle } from 'lucide-react';
import type { PaymentStatus, PaymentsReport, PaymentWithParties } from '@/types';
import { adminService } from '@/lib/services';
import { TRANSFER_METHOD_LABELS } from '@/lib/constants';
import { cn, formatDate, formatPrice, formatTime } from '@/lib/utils';
import { rangeLabel, resolveRange } from '@/lib/date-range';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { Separator } from '@/components/ui/misc';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { ProofViewer } from '@/components/payment/proof-viewer';
import { ResultSummary, TableToolbar, useTableQuery } from './table-toolbar';

const HEADERS = ['Référence', 'Patient', 'Psychologue', 'Rendez-vous', 'Montant', 'Statut', ''];

const FILTERS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'payment_pending', label: 'En attente' },
  { value: 'payment_proof_submitted', label: 'À confirmer' },
  { value: 'payment_confirmed', label: 'Confirmés' },
  { value: 'payment_rejected', label: 'Refusés' },
  { value: 'payment_expired', label: 'Expirés' },
];

/**
 * Every payment on the platform, at every stage.
 *
 * Money moves off platform here, so the admin's job is arbitration rather than
 * reconciliation: the funnel tiles show where bookings get stuck, and each row
 * opens the audit trail of who declared and confirmed what.
 */
export function PaymentsTable() {
  const { search, setSearch, range, setRange, page, setPage } = useTableQuery();
  const [status, setStatus] = React.useState<PaymentStatus | 'all'>('all');
  const [report, setReport] = React.useState<PaymentsReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [inspected, setInspected] = React.useState<PaymentWithParties | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const { from, to } = resolveRange(range);
    adminService
      .payments({ q: search || undefined, status, from, to, page, perPage: 12 })
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, range, page]);

  const totals = report?.totals ?? {
    pending: 0,
    toConfirm: 0,
    confirmed: 0,
    rejected: 0,
    confirmedAmount: 0,
  };
  const period = rangeLabel(range);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Paiements en attente"
          value={totals.pending}
          icon={Clock}
          tone="warning"
          hint={period}
        />
        <DashboardCard
          label="À confirmer"
          value={totals.toConfirm}
          icon={Landmark}
          tone="navy"
          hint="déclarés par les patients"
        />
        <DashboardCard
          label="Paiements confirmés"
          value={totals.confirmed}
          icon={CheckCircle2}
          tone="success"
          hint={formatPrice(totals.confirmedAmount)}
        />
        <DashboardCard
          label="Paiements refusés"
          value={totals.rejected}
          icon={XCircle}
          tone="error"
          hint={period}
        />
      </div>

      <Card className="mt-4 flex items-start gap-3 bg-info-soft/60 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        <p className="text-base leading-relaxed text-muted-foreground">
          Ces montants transitent directement du patient au psychologue. La plateforme n’en encaisse
          rien et ne prélève aucune commission — elle ne fait qu’enregistrer les déclarations des
          deux parties.
        </p>
      </Card>

      <div className="mt-6">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Référence, patient ou psychologue…"
          range={range}
          onRangeChange={setRange}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              aria-pressed={status === filter.value}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                status === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Card className="p-16 text-center text-base text-muted-foreground">Chargement…</Card>
        ) : !report || report.meta.total === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucune transaction sur cette période"
            description="Aucun paiement ne correspond à ces critères. Élargissez la période ou changez de filtre."
          />
        ) : (
          <>
            <ResultSummary total={report.meta.total} noun="transaction" period={period} />

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px]">
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
                    {report.data.map((payment) => (
                      <tr key={payment.id} className="transition-colors hover:bg-muted/40">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-base font-medium text-secondary">
                          {payment.reference}
                        </td>
                        <td className="px-5 py-4 text-base text-muted-foreground">
                          {payment.patient.fullName}
                        </td>
                        <td className="px-5 py-4 text-base text-muted-foreground">
                          {payment.psychologist.fullName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                          {formatDate(payment.appointment.startsAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-secondary">
                          {formatPrice(payment.amount, payment.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge kind="payment" status={payment.status} size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-end">
                          <Button variant="ghost" size="sm" onClick={() => setInspected(payment)}>
                            Détail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Pagination
              page={report.meta.page}
              lastPage={report.meta.lastPage}
              onPageChange={setPage}
              className="mt-6"
            />
          </>
        )}
      </div>

      <PaymentDetail payment={inspected} onClose={() => setInspected(null)} />
    </>
  );
}

/** Full record of one payment: parties, amounts, proof and action history. */
function PaymentDetail({
  payment,
  onClose,
}: {
  payment: PaymentWithParties | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(payment)}
      onOpenChange={(open) => !open && onClose()}
      title={payment ? `Paiement ${payment.reference}` : 'Paiement'}
      description={payment ? `Rendez-vous ${payment.appointment.reference}` : undefined}
      size="lg"
      footer={
        <Button variant="outline-muted" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {payment && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="payment" status={payment.status} />
            <StatusBadge kind="appointment" status={payment.appointment.status} />
            {payment.method && <Badge variant="outline">{TRANSFER_METHOD_LABELS[payment.method]}</Badge>}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail label="Patient" value={payment.patient.fullName} />
            <Detail label="Psychologue" value={payment.psychologist.fullName} />
            <Detail label="Montant total" value={formatPrice(payment.amount, payment.currency)} />
            <Detail label="Perçu par le psychologue" value={formatPrice(payment.amount, payment.currency)} />
            <Detail
              label="Séance"
              value={`${formatDate(payment.appointment.startsAt)} à ${formatTime(payment.appointment.startsAt)}`}
            />
          </dl>

          {payment.rejectionReason && (
            <p className="rounded-card bg-error-soft p-4 text-base leading-relaxed text-muted-foreground">
              <span className="font-medium text-secondary">Motif du refus : </span>
              {payment.rejectionReason}
            </p>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-subtle-foreground">
              Preuve de paiement
            </p>
            {payment.proof ? (
              <ProofViewer proof={payment.proof} reference={payment.reference} />
            ) : (
              <p className="rounded-control bg-surface-alt px-3 py-2.5 text-base text-muted-foreground">
                Aucune preuve déposée.
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-secondary">
              <History className="size-4 text-primary" aria-hidden />
              Historique des actions
            </h3>
            <ol className="mt-3 space-y-3">
              {payment.events.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-base text-secondary">{entry.label}</p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">{entry.note}</p>
                    )}
                    <p className="text-xs text-subtle-foreground">
                      {formatDate(entry.at)} à {formatTime(entry.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-subtle-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}
