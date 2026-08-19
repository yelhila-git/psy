import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, ChevronLeft } from 'lucide-react';
import { invoiceService } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/shell';
import { ConsultationInvoiceDocument } from '@/components/payment/consultation-invoice';
import { AutoPrint, PrintButton } from '@/components/payment/print-button';

export const metadata: Metadata = { title: 'Facture' };

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const [{ invoiceId }, { print }] = await Promise.all([params, searchParams]);
  const invoice = await invoiceService.getById(invoiceId);
  if (!invoice) notFound();

  return (
    <>
      {/* Arrived from the download icon in the list. */}
      {print === '1' && <AutoPrint />}

      <div className="print:hidden">
        <Link
          href="/dashboard/psychologist/invoices"
          className="mb-4 inline-flex items-center gap-1 text-base text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Retour aux factures
        </Link>

        <PageHeader
          title={`Facture ${invoice.reference}`}
          description={`Consultation du ${new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'long',
          }).format(new Date(invoice.consultation.startsAt))}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline-muted" asChild>
                <Link href={`/dashboard/psychologist/appointments`}>
                  <CalendarDays />
                  Le rendez-vous
                </Link>
              </Button>
              <PrintButton />
            </div>
          }
        />
      </div>

      <div className="mx-auto max-w-3xl print:max-w-none">
        <ConsultationInvoiceDocument invoice={invoice} />
      </div>
    </>
  );
}
