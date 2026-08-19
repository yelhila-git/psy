'use client';

import * as React from 'react';
import { SearchX } from 'lucide-react';
import type { Paginated, Patient } from '@/types';
import { adminService } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { rangeLabel, resolveRange } from '@/lib/date-range';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { ResultSummary, TableToolbar, useTableQuery } from './table-toolbar';

const HEADERS = ['Patient', 'E-mail', 'Ville', 'Inscription', 'Consultations', 'Favoris'];

export function PatientsTable() {
  const { search, setSearch, range, setRange, page, setPage } = useTableQuery();
  const [report, setReport] = React.useState<Paginated<Patient> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const { from, to } = resolveRange(range);
    adminService.patients({ q: search || undefined, from, to, page, perPage: 12 }).then((result) => {
      if (cancelled) return;
      setReport(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [search, range, page]);

  const period = rangeLabel(range);

  return (
    <>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nom, e-mail ou ville…"
        range={range}
        onRangeChange={setRange}
        dateLabel="Inscription"
      />

      {loading ? (
        <Card className="p-16 text-center text-base text-muted-foreground">Chargement…</Card>
      ) : !report || report.meta.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun patient sur cette période"
          description="Aucun compte ne correspond à ces critères. Élargissez la période ou effacez la recherche."
        />
      ) : (
        <>
          <ResultSummary total={report.meta.total} noun="patient" period={period} />

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
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
                  {report.data.map((patient) => (
                    <tr key={patient.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={patient.avatarUrl} name={patient.fullName} size="sm" />
                          <p className="truncate text-base font-semibold text-secondary">
                            {patient.fullName}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-base text-muted-foreground">{patient.email}</td>
                      <td className="px-5 py-4 text-base text-muted-foreground">
                        {patient.city ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                        {formatDate(patient.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="primary" size="sm">
                          {patient.appointmentCount}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-base text-muted-foreground">
                        {patient.favoritePsychologistIds.length}
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
    </>
  );
}
