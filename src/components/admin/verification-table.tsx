'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Search,
  SearchX,
  XCircle,
} from 'lucide-react';
import type { Psychologist, VerificationStatus } from '@/types';
import { adminService } from '@/lib/services';
import { LANGUAGES, SPECIALTIES } from '@/lib/constants';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field, Textarea } from '@/components/ui/input';
import { Rating } from '@/components/ui/rating';
import { Separator } from '@/components/ui/misc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Modal } from '@/components/ui/dialog';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/toast';

const FILTERS: { value: VerificationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'all', label: 'Tous' },
];

const label = (list: readonly { value: string; label: string }[], value: string) =>
  list.find((i) => i.value === value)?.label ?? value;

export function VerificationTable() {
  const { toast } = useToast();

  const [status, setStatus] = React.useState<VerificationStatus | 'all'>('pending');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<Psychologist[]>([]);
  const [meta, setMeta] = React.useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = React.useState(true);

  const [viewing, setViewing] = React.useState<Psychologist | null>(null);
  const [rejecting, setRejecting] = React.useState<Psychologist | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [working, setWorking] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    adminService
      .psychologists({ status, q: search || undefined, page, perPage: 10 })
      .then((result) => {
        setRows(result.data);
        setMeta({ total: result.meta.total, lastPage: result.meta.lastPage });
        setLoading(false);
      });
  }, [status, search, page]);

  React.useEffect(load, [load]);
  React.useEffect(() => setPage(1), [status, search]);

  const decide = async (psychologist: Psychologist, next: VerificationStatus, note?: string) => {
    setWorking(true);
    await adminService.setVerification(psychologist.id, next, note);
    setWorking(false);
    setViewing(null);
    setRejecting(null);
    setRejectReason('');
    load();

    toast({
      title: next === 'approved' ? 'Profil approuvé' : 'Profil refusé',
      description:
        next === 'approved'
          ? `${psychologist.fullName} est désormais visible par les patients.`
          : `${psychologist.fullName} a été informé de la décision.`,
      variant: next === 'approved' ? 'success' : 'warning',
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              aria-pressed={status === filter.value}
              className={cn(
                'rounded-control border px-4 py-2 text-base font-medium transition-all',
                status === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un praticien…"
            startAdornment={<Search />}
            aria-label="Rechercher un praticien"
          />
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center text-base text-muted-foreground">Chargement…</Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun praticien dans cette vue"
          description={
            status === 'pending'
              ? 'La file de vérification est vide. Tous les dossiers ont été traités.'
              : 'Aucun résultat pour ces critères.'
          }
          action={status !== 'all' ? { label: 'Voir tous les profils', onClick: () => setStatus('all') } : undefined}
        />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    {['Praticien', 'E-mail', 'Spécialité', 'Inscription', 'Tarif', 'Statut', 'Actions'].map(
                      (header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-5 py-3 text-start text-2xs font-bold uppercase tracking-wider text-subtle-foreground"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((psy) => (
                    <tr key={psy.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={psy.avatarUrl} name={psy.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-secondary">
                              {psy.fullName}
                            </p>
                            <p className="truncate text-xs text-subtle-foreground">{psy.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-base text-muted-foreground">{psy.email}</td>
                      <td className="px-5 py-4">
                        <Badge variant="primary" size="sm">
                          {label(SPECIALTIES, psy.specialties[0] ?? '')}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                        {psy.submittedAt ? formatDate(psy.submittedAt) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-secondary">
                        {formatPrice(psy.pricePerHour, psy.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge kind="verification" status={psy.verificationStatus} size="sm" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setViewing(psy)}
                            aria-label={`Examiner le dossier de ${psy.fullName}`}
                          >
                            <Eye />
                          </Button>
                          {psy.verificationStatus === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-success hover:bg-success-soft"
                                onClick={() => decide(psy, 'approved')}
                                aria-label={`Approuver ${psy.fullName}`}
                              >
                                <CheckCircle2 />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-error hover:bg-error-soft"
                                onClick={() => setRejecting(psy)}
                                aria-label={`Refuser ${psy.fullName}`}
                              >
                                <XCircle />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination page={page} lastPage={meta.lastPage} onPageChange={setPage} className="mt-8" />
        </>
      )}

      {/* Review drawer */}
      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent size="lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>Dossier de vérification</DialogTitle>
              </DialogHeader>

              <div className="flex items-start gap-4">
                <Avatar src={viewing.avatarUrl} name={viewing.fullName} size="xl" square />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-secondary">{viewing.fullName}</p>
                  <p className="text-base text-muted-foreground">{viewing.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StatusBadge kind="verification" status={viewing.verificationStatus} size="sm" />
                    <Rating value={viewing.rating} count={viewing.reviewCount} size="sm" />
                  </div>
                </div>
                <Button variant="outline-muted" size="sm" asChild>
                  <Link href={`/psychologists/${viewing.slug}`} target="_blank">
                    <ExternalLink />
                    Profil
                  </Link>
                </Button>
              </div>

              <Separator />

              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="E-mail" value={viewing.email} />
                <Detail label="Téléphone" value={viewing.phone ?? '—'} />
                <Detail label="Ville" value={viewing.city} />
                <Detail label="Expérience" value={`${viewing.yearsOfExperience} ans`} />
                <Detail
                  label="Tarif horaire"
                  value={formatPrice(viewing.pricePerHour, viewing.currency)}
                />
                <Detail
                  label="Langues"
                  value={viewing.languages.map((l) => label(LANGUAGES, l)).join(', ')}
                />
                <Detail
                  label="Spécialités"
                  value={viewing.specialties.map((s) => label(SPECIALTIES, s)).join(', ')}
                  full
                />
              </dl>

              <Separator />

              <div>
                <h3 className="text-base font-bold text-secondary">Formation déclarée</h3>
                <ul className="mt-2 space-y-1.5">
                  {viewing.education.map((edu) => (
                    <li key={edu.id} className="text-base text-muted-foreground">
                      <span className="font-medium text-secondary">{edu.degree}</span> —{' '}
                      {edu.institution} ({edu.year})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-secondary">Pièces justificatives</h3>
                <ul className="mt-2 space-y-2">
                  {(viewing.documents ?? []).map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-control border border-border p-3"
                    >
                      <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-base text-secondary">
                        {doc.fileName}
                      </span>
                      <Badge variant={doc.status === 'approved' ? 'success' : 'warning'} size="sm">
                        {doc.status === 'approved' ? 'Validé' : 'À vérifier'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              {viewing.verificationStatus === 'pending' && (
                <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline-muted"
                    onClick={() => {
                      setRejecting(viewing);
                      setViewing(null);
                    }}
                  >
                    <XCircle />
                    Refuser
                  </Button>
                  <Button loading={working} onClick={() => decide(viewing, 'approved')}>
                    <CheckCircle2 />
                    Approuver le profil
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection reason */}
      <Modal
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Refuser ce profil ?"
        description="Le praticien recevra votre motif par e-mail et pourra soumettre un dossier corrigé."
        footer={
          <>
            <Button variant="outline-muted" onClick={() => setRejecting(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={working}
              disabled={rejectReason.trim().length < 10}
              onClick={() => rejecting && decide(rejecting, 'rejected', rejectReason)}
            >
              Confirmer le refus
            </Button>
          </>
        }
      >
        <Field
          label="Motif du refus"
          htmlFor="reject-reason"
          hint="Au moins 10 caractères. Soyez précis : le praticien doit savoir quoi corriger."
          required
        >
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Le diplôme fourni est illisible, merci de renvoyer un scan de meilleure qualité…"
          />
        </Field>
      </Modal>
    </>
  );
}

function Detail({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs uppercase tracking-wide text-subtle-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}
