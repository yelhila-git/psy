import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Eye, FileText, Gift, Receipt, Wallet } from 'lucide-react';
import { invoiceService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { modeLabel } from '@/lib/invoices';
import { formatDate, formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { InvoiceStatusBadge } from '@/components/payment/consultation-invoice';

export const metadata: Metadata = { title: 'Factures' };

export default async function InvoicesPage() {
  const [invoices, stats] = await Promise.all([
    invoiceService.list({ psychologistId: CURRENT_PSYCHOLOGIST_ID, perPage: 50 }),
    invoiceService.statsFor(CURRENT_PSYCHOLOGIST_ID),
  ]);

  return (
    <>
      <PageHeader
        title="Factures"
        description="Une facture est émise automatiquement dès que vous confirmez la réservation d’un patient."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Facturé ce mois"
          value={formatPrice(stats.billedThisMonth, stats.currency)}
          icon={Wallet}
          tone="primary"
          hint="montant dû par vos patients"
        />
        <DashboardCard
          label="Total facturé"
          value={formatPrice(stats.billedTotal, stats.currency)}
          icon={Receipt}
          tone="navy"
          hint="depuis votre inscription"
        />
        <DashboardCard
          label="Factures émises"
          value={stats.issued}
          icon={FileText}
          tone="success"
          hint="consultations confirmées"
        />
        <DashboardCard
          label="Séances offertes"
          value={stats.freeCount}
          icon={Gift}
          tone="warning"
          hint={`${formatPrice(stats.waived, stats.currency)} offerts`}
        />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-md font-bold text-secondary">Toutes vos factures</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Les premières consultations apparaissent à 0 {stats.currency} : la séance a bien eu lieu
            et figure donc dans vos écritures, avec le tarif offert en regard.
          </p>
        </div>

        {invoices.data.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            Aucune facture pour l’instant. La première sera créée dès que vous confirmerez la
            réservation d’un patient.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {['Référence', 'Patient', 'Consultation', 'Émise le', 'Montant', 'Statut'].map(
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
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.data.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-base font-medium text-secondary">
                      <Link
                        href={`/dashboard/psychologist/invoices/${invoice.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {invoice.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-base text-muted-foreground">
                      {invoice.billedTo.fullName}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                      {modeLabel(invoice.consultation.mode)} ·{' '}
                      {invoice.consultation.durationMinutes} min
                      <span className="block text-2xs text-subtle-foreground">
                        {formatDate(invoice.consultation.startsAt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-base font-bold text-secondary">
                      {formatPrice(invoice.total, invoice.currency)}
                      {invoice.discount > 0 && (
                        <span className="ms-2 text-xs font-normal text-subtle-foreground line-through">
                          {formatPrice(invoice.subtotal, invoice.currency)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <InvoiceStatusBadge status={invoice.status} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {/* Icon-only, so each action carries its own label: the
                          tooltip for a sighted user, the accessible name for
                          everyone else. */}
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/psychologist/invoices/${invoice.id}`}
                          title={`Voir la facture ${invoice.reference}`}
                          aria-label={`Voir la facture ${invoice.reference}`}
                          className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Eye className="size-4" aria-hidden />
                        </Link>
                        <Link
                          href={`/dashboard/psychologist/invoices/${invoice.id}?print=1`}
                          title={`Télécharger la facture ${invoice.reference} (PDF)`}
                          aria-label={`Télécharger la facture ${invoice.reference} en PDF`}
                          className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Download className="size-4" aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
