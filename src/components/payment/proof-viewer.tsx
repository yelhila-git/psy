'use client';

import * as React from 'react';
import { FileText, ImageOff, Paperclip } from 'lucide-react';
import type { PaymentProof } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';

function formatSize(bytes: number) {
  return bytes > 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} Mo`
    : `${Math.round(bytes / 1000)} Ko`;
}

/**
 * Opens the patient's proof full size.
 *
 * Mock proofs generated at seed time carry no file, only a name — the viewer
 * says so rather than rendering a broken image, since a practitioner about to
 * confirm money needs to know whether they are looking at nothing or at a
 * receipt.
 */
export function ProofViewer({ proof, reference }: { proof: PaymentProof; reference: string }) {
  const [open, setOpen] = React.useState(false);
  const isImage = !proof.fileName.toLowerCase().endsWith('.pdf');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-control border border-border bg-surface-alt p-2.5 text-start transition-colors hover:border-primary"
      >
        {isImage && proof.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proof.url} alt="" className="size-11 shrink-0 rounded-control object-cover" />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <FileText className="size-5" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-secondary">
            {proof.fileName}
          </span>
          <span className="block text-xs text-subtle-foreground">
            {formatSize(proof.sizeBytes)} · déposé le {formatDate(proof.uploadedAt)} à{' '}
            {formatTime(proof.uploadedAt)}
          </span>
        </span>
        <Paperclip className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Preuve de paiement"
        description={`Référence ${reference} · ${proof.fileName}`}
        size="lg"
        footer={
          <Button variant="outline-muted" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        }
      >
        {isImage && proof.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proof.url}
            alt={`Preuve de paiement ${reference}`}
            className="max-h-[60vh] w-full rounded-card object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-card bg-surface-alt px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-subtle-foreground">
              {proof.url ? <FileText className="size-6" /> : <ImageOff className="size-6" />}
            </span>
            <p className="text-base text-muted-foreground">
              {proof.url
                ? 'Aperçu indisponible pour les PDF. Le fichier reste consultable côté backend.'
                : 'Ce justificatif fait partie du jeu de démonstration : aucun fichier n’y est réellement attaché.'}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
