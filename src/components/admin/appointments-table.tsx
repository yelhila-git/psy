'use client';

import * as React from 'react';
import { CalendarCheck, CalendarClock, CalendarX2, CheckCircle2, SearchX } from 'lucide-react';
import type { AppointmentWithParties, Paginated } from '@/types';
import { adminService } from '@/lib/services';
import { formatDate, formatPrice, formatTime } from '@/lib/utils';
import { rangeLabel, resolveRange } from '@/lib/date-range';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { ResultSummary, TableToolbar, useTableQuery } from './table-toolbar';

type Report = Paginated<AppointmentWithParties> & { totals: Record<string, number> };

const HEADERS = ['Référence', 'Patient', 'Psychologue', 'Date', 'Durée', 'Montant', 'Statut'];

export function AppointmentsTable() {
  const { search, setSearch, range, setRange, page, setPage } = useTableQuery();
  const [report, setReport] = React.useState<Report | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const { from, to } = resolveRange(range);
    adminService
      .appointments({ q: search || undefined, from, to, page, perPage: 12 })
      .then((result) => {
        if (cancelled) return;
        setReport(result);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, range, page]);

  const totals = report?.totals ?? {};
  const period = rangeLabel(range);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Total"
          value={totals.total ?? 0}
          icon={CalendarCheck}
          tone="navy"
          hint={period}
        />
        <DashboardCard
          label="Confirmés"
          value={totals.confirmed ?? 0}
          icon={CalendarClock}
          tone="primary"
        />
        <DashboardCard
          label="Terminés"
          value={totals.completed ?? 0}
          icon={CheckCircle2}
          tone="success"
        />
        <DashboardCard
          label="Annulés / absences"
          value={totals.cancelled ?? 0}
          icon={CalendarX2}
          tone="error"
        />
      </div>

      <div className="mt-6">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Référence, patient ou psychologue…"
          range={range}
          onRangeChange={setRange}
          dateLabel="Date de séance"
        />

        {loading ? (
          <Card className="p-16 text-center text-base text-muted-foreground">Chargement…</Card>
        ) : !report || report.meta.total === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucune consultation sur cette période"
            description="Aucun rendez-vous ne correspond à ces critères. Élargissez la période ou effacez la recherche."
          />
        ) : (
          <>
            <ResultSummary total={report.meta.total} noun="consultation" period={period} />

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
                    {report.data.map((a) => (
                      <tr key={a.id} className="transition-colors hover:bg-muted/40">
                        <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-secondary">
                          {a.reference}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={a.patient.avatarUrl} name={a.patient.fullName} size="xs" />
                            <span className="truncate text-base text-muted-foreground">
                              {a.patient.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={a.psychologist.avatarUrl}
                              name={a.psychologist.fullName}
                              size="xs"
                            />
                            <span className="truncate text-base text-muted-foreground">
                              {a.psychologist.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                          {formatDate(a.startsAt)} · {formatTime(a.startsAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                          {a.durationMinutes} min
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-secondary">
                          {formatPrice(a.price, a.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge kind="appointment" status={a.status} size="sm" />
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
    </>
  );
}
