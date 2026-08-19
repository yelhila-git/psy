'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageSquare, Search, SearchX } from 'lucide-react';
import type { Patient } from '@/types';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/feedback';

export type PatientRow = Patient & {
  sessionCount: number;
  lastSessionAt?: string;
  nextSessionAt?: string;
};

export function PatientTable({ patients }: { patients: PatientRow[] }) {
  const [search, setSearch] = React.useState('');

  const filtered = patients.filter((p) =>
    search
      ? [p.fullName, p.email, p.city ?? ''].join(' ').toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <>
      <div className="mb-4 max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un patient…"
          startAdornment={<Search />}
          aria-label="Rechercher un patient"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun patient ne correspond"
          description="Essayez un autre nom ou effacez la recherche."
          action={{ label: 'Effacer la recherche', onClick: () => setSearch('') }}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {['Patient', 'Ville', 'Séances', 'Dernière séance', 'Prochaine', ''].map((header) => (
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
                {filtered.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={patient.avatarUrl} name={patient.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-secondary">
                            {patient.fullName}
                          </p>
                          <p className="truncate text-xs text-subtle-foreground">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-base text-muted-foreground">
                      {patient.city ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="primary" size="sm">
                        {patient.sessionCount}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                      {patient.lastSessionAt ? formatDate(patient.lastSessionAt) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {patient.nextSessionAt ? (
                        <span className="text-base font-medium text-success">
                          {formatDate(patient.nextSessionAt)}
                        </span>
                      ) : (
                        <span className="text-base text-subtle-foreground">Non planifiée</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <Button variant="ghost" size="icon-sm" asChild aria-label="Envoyer un message">
                        <Link href="/dashboard/psychologist/messages">
                          <MessageSquare />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
