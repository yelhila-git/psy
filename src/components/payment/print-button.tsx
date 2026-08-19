'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Prints the current page.
 *
 * The facture is laid out to survive `@media print` on its own, so the browser's
 * "save as PDF" produces the document without the app shipping a PDF library.
 */
export function PrintButton({ label = 'Imprimer / PDF' }: { label?: string }) {
  return (
    <Button variant="outline-muted" onClick={() => window.print()}>
      <Printer />
      {label}
    </Button>
  );
}

/**
 * Opens the print dialog once, on arrival.
 *
 * What the download icon in the invoice list actually does: there is no PDF
 * library, so "télécharger" means landing on the printable document and letting
 * the browser save it. Deferred a frame so the layout has painted — Chrome
 * prints whatever is on screen when the dialog opens, and a print fired during
 * hydration can capture a half-rendered page.
 */
export function AutoPrint() {
  React.useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
