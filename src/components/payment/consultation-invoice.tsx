import { Gift } from 'lucide-react';
import type { ConsultationInvoice } from '@/types';
import { formatDate, formatPrice, formatTime } from '@/lib/utils';
import { modeLabel } from '@/lib/invoices';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/** The status chip, in the practitioner's language rather than the type's. */
export function InvoiceStatusBadge({
  status,
  size = 'default',
}: {
  status: ConsultationInvoice['status'];
  size?: 'sm' | 'default';
}) {
  if (status === 'free') {
    return (
      <Badge variant="info" size={size}>
        Séance offerte
      </Badge>
    );
  }
  if (status === 'cancelled') {
    return (
      <Badge variant="error" size={size}>
        Annulée
      </Badge>
    );
  }
  return (
    <Badge variant="success" size={size}>
      Payée
    </Badge>
  );
}

function Party({ heading, lines }: { heading: string; lines: (string | undefined)[] }) {
  return (
    <div>
      <p className="text-2xs font-bold uppercase tracking-wider text-subtle-foreground">
        {heading}
      </p>
      <div className="mt-2 space-y-0.5">
        {lines.filter(Boolean).map((line, index) => (
          <p
            key={line}
            className={
              index === 0 ? 'text-md font-bold text-secondary' : 'text-base text-muted-foreground'
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-end text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}

/**
 * The facture itself.
 *
 * Every value is read off the invoice, never re-derived from the practitioner's
 * current profile or rate — see `InvoiceParty` in the types for why a document
 * has to stay frozen at the moment it was issued.
 */
export function ConsultationInvoiceDocument({ invoice }: { invoice: ConsultationInvoice }) {
  const { consultation } = invoice;
  const free = invoice.status === 'free';

  return (
    <Card className="overflow-hidden print:border-0 print:shadow-none">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div>
          <p className="text-2xs font-bold uppercase tracking-wider text-primary">Facture</p>
          <p className="mt-1 font-mono text-2xl font-bold text-secondary">{invoice.reference}</p>
          <p className="mt-1 text-base text-muted-foreground">
            Émise le {formatDate(invoice.issuedAt)}
          </p>
        </div>
        <div className="sm:text-end">
          <InvoiceStatusBadge status={invoice.status} />
          <p className="mt-2 text-2xl font-bold text-secondary">
            {formatPrice(invoice.total, invoice.currency)}
          </p>
          {invoice.paidAt && (
            <p className="text-xs text-subtle-foreground">Réglée le {formatDate(invoice.paidAt)}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <Party
          heading="Praticien"
          lines={[
            invoice.issuer.fullName,
            invoice.issuer.title,
            invoice.issuer.city,
            invoice.issuer.email,
          ]}
        />
        <Party heading="Facturé à" lines={[invoice.billedTo.fullName, invoice.billedTo.email]} />
      </div>

      <div className="border-b border-border p-6 sm:p-8">
        <h2 className="text-md font-bold text-secondary">Détail de la consultation</h2>
        <dl className="mt-3 divide-y divide-border">
          <DetailRow
            label="Référence du rendez-vous"
            value={<span className="font-mono">{consultation.appointmentReference}</span>}
          />
          <DetailRow
            label="Date et heure"
            value={`${formatDate(consultation.startsAt)} à ${formatTime(consultation.startsAt)}`}
          />
          <DetailRow
            label="Durée"
            value={`${consultation.durationMinutes} minutes (fin ${formatTime(consultation.endsAt)})`}
          />
          <DetailRow label="Modalité" value={modeLabel(consultation.mode)} />
          {consultation.reason && <DetailRow label="Motif" value={consultation.reason} />}
          <DetailRow
            label="Première consultation"
            value={consultation.isFirstConsultation ? 'Oui' : 'Non'}
          />
        </dl>
      </div>

      <div className="p-6 sm:p-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-border">
                {['Prestation', 'Durée', 'Prix unitaire', 'Montant'].map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={`pb-2 text-2xs font-bold uppercase tracking-wider text-subtle-foreground ${
                      index === 0 ? 'text-start' : 'text-end'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.lines.map((line) => (
                <tr key={line.label}>
                  <td className="py-3 text-base text-secondary">{line.label}</td>
                  <td className="py-3 text-end text-base text-muted-foreground">
                    {line.durationMinutes} min
                  </td>
                  <td className="py-3 text-end text-base text-muted-foreground">
                    {formatPrice(line.unitPrice, invoice.currency)}
                  </td>
                  <td className="py-3 text-end text-base font-medium text-secondary">
                    {formatPrice(line.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-1">
            <div className="flex justify-between text-base text-muted-foreground">
              <dt>Sous-total</dt>
              <dd>{formatPrice(invoice.subtotal, invoice.currency)}</dd>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-base text-success">
                <dt className="inline-flex items-center gap-1.5">
                  <Gift className="size-3.5" aria-hidden />
                  Première consultation offerte
                </dt>
                <dd>− {formatPrice(invoice.discount, invoice.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-md font-bold text-secondary">
              <dt>Total dû</dt>
              <dd>{formatPrice(invoice.total, invoice.currency)}</dd>
            </div>
          </dl>
        </div>

        {invoice.paymentReference && (
          <p className="mt-6 text-xs text-subtle-foreground">
            Réglée par virement instantané, référence{' '}
            <span className="font-mono">{invoice.paymentReference}</span>, reçue directement sur le
            compte du praticien.
          </p>
        )}

        <p className="mt-2 text-xs text-subtle-foreground">
          {free
            ? 'Première consultation offerte entre ce patient et ce praticien — aucun montant n’est dû.'
            : 'Le montant est versé intégralement au praticien.'}{' '}
          AlloMonPsy n’intervient pas dans la transaction et ne prélève aucune commission.
        </p>
      </div>
    </Card>
  );
}
