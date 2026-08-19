'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Repeat, SearchX, TrendingUp, XCircle } from 'lucide-react';
import type { SubscriptionStatus, SubscriptionsReport } from '@/types';
import { adminService } from '@/lib/services';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { ResultSummary, TableToolbar, useTableQuery } from './table-toolbar';

const HEADERS = ['Praticien', 'Formule', 'Prix / mois', 'Consommation', 'Renouvellement', 'Statut'];

const FILTERS: { value: SubscriptionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'past_due', label: 'Impayés' },
  { value: 'expired', label: 'Expirés' },
  { value: 'cancelled', label: 'Résiliés' },
];

const STATUS: Record<
  SubscriptionStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'outline' }
> = {
  active: { label: 'Actif', variant: 'success' },
  past_due: { label: 'Impayé', variant: 'warning' },
  expired: { label: 'Expiré', variant: 'error' },
  cancelled: { label: 'Résilié', variant: 'outline' },
};

/**
 * The platform's revenue book.
 *
 * Subscriptions are the only money AlloMonPsy ever receives — no commission is
 * taken on any consultation — so this table is the whole P&L, and the quota
 * column is what tells an admin who is about to need a bigger plan.
 */
export function SubscriptionsTable() {
  const { search, setSearch, range, setRange, page, setPage } = useTableQuery();
  const [status, setStatus] = React.useState<SubscriptionStatus | 'all'>('all');
  const [report, setReport] = React.useState<SubscriptionsReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    adminService
      .subscriptions({ q: search || undefined, status, page, perPage: 12 })
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, page]);

  const totals = report?.totals ?? { mrr: 0, active: 0, pastDue: 0, expired: 0 };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Revenu mensuel récurrent"
          value={formatPrice(totals.mrr)}
          icon={TrendingUp}
          tone="success"
          hint="abonnements actifs"
        />
        <DashboardCard
          label="Abonnements actifs"
          value={totals.active}
          icon={CheckCircle2}
          tone="primary"
        />
        <DashboardCard
          label="Impayés"
          value={totals.pastDue}
          icon={AlertTriangle}
          tone={totals.pastDue > 0 ? 'warning' : 'navy'}
          hint="à relancer"
        />
        <DashboardCard
          label="Expirés ou résiliés"
          value={totals.expired}
          icon={XCircle}
          tone="error"
          hint="retirés de la recherche"
        />
      </div>

      <Card className="mt-4 flex items-start gap-3 bg-info-soft/60 p-5">
        <Repeat className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        <p className="text-base leading-relaxed text-muted-foreground">
          La plateforme ne prélève aucune commission sur les consultations. L’abonnement des
          praticiens est sa seule source de revenus ; les honoraires vont directement du patient au
          psychologue.
        </p>
      </Card>

      <div className="mt-6">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom du praticien…"
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
            title="Aucun abonnement"
            description="Aucun praticien ne correspond à ces critères. Changez de filtre ou effacez la recherche."
          />
        ) : (
          <>
            <ResultSummary total={report.meta.total} noun="abonnement" period="toutes périodes" />

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      {HEADERS.map((header) => (
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
                    {report.data.map((row) => {
                      const status = STATUS[row.status];
                      const quotaReached =
                        row.monthlyQuota !== null && row.periodUsage >= row.monthlyQuota;

                      return (
                        <tr key={row.psychologistId} className="transition-colors hover:bg-muted/40">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={row.avatarUrl} name={row.fullName} size="sm" square />
                              <span className="text-base font-medium text-secondary">
                                {row.fullName}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <Badge variant={row.pricePerMonth === 0 ? 'outline' : 'primary'} size="sm">
                              {row.planName}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-secondary">
                            {row.pricePerMonth === 0 ? 'Gratuit' : formatPrice(row.pricePerMonth)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-base">
                            <span className={quotaReached ? 'font-bold text-error' : 'text-muted-foreground'}>
                              {row.periodUsage}
                              {row.monthlyQuota === null ? ' / illimité' : ` / ${row.monthlyQuota}`}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                            {formatDate(row.renewsAt)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
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
    </>
  );
}
