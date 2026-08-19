'use client';

import * as React from 'react';
import { CheckCircle2, FileText, Paperclip, Trash2, Upload, Zap } from 'lucide-react';
import type { TransferMethod } from '@/types';
import {
  DEFAULT_TRANSFER_METHOD,
  TRANSFER_METHOD_HINT,
  TRANSFER_METHOD_LABELS,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ACCEPTED = 'image/png,image/jpeg,image/webp,application/pdf';

export interface ProofSubmission {
  method: TransferMethod;
  transferredAt: string;
  proof?: { fileName: string; url: string; sizeBytes: number };
}

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatSize(bytes: number) {
  return bytes > 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} Mo`
    : `${Math.round(bytes / 1000)} Ko`;
}

/**
 * The patient's declaration that they transferred the money.
 *
 * Submitting this never marks the payment as received — it hands the
 * practitioner something to check against their bank statement. The copy says
 * so explicitly, because a patient who believes the booking is settled will
 * show up to a locked room.
 */
export function ProofForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (submission: ProofSubmission) => void;
}) {
  const method: TransferMethod = DEFAULT_TRANSFER_METHOD;
  const [transferredAt, setTransferredAt] = React.useState(() => toLocalInputValue(new Date()));
  const [file, setFile] = React.useState<{ fileName: string; url: string; sizeBytes: number } | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Object URLs outlive the component unless they are released explicitly.
  React.useEffect(() => {
    return () => {
      if (file?.url) URL.revokeObjectURL(file.url);
    };
  }, [file?.url]);

  const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (selected.size > MAX_PROOF_BYTES) {
      setError('Fichier trop volumineux — 5 Mo maximum.');
      return;
    }
    setError(null);
    if (file?.url) URL.revokeObjectURL(file.url);
    setFile({
      fileName: selected.name,
      url: URL.createObjectURL(selected),
      sizeBytes: selected.size,
    });
  };

  const removeFile = () => {
    if (file?.url) URL.revokeObjectURL(file.url);
    setFile(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      method,
      transferredAt: new Date(transferredAt).toISOString(),
      proof: file ?? undefined,
    });
  };

  const isImage = file ? !file.fileName.toLowerCase().endsWith('.pdf') : false;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* One method, so this states it rather than asking. */}
      <div className="flex items-start gap-3 rounded-card border border-primary bg-primary-soft/40 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
          <Zap className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-secondary">
            {TRANSFER_METHOD_LABELS[method]}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{TRANSFER_METHOD_HINT}</p>
        </div>
      </div>

      <Field
        label="Date et heure du transfert"
        htmlFor="transferred-at"
        hint="Elle aide le psychologue à retrouver l’opération sur son relevé."
        required
      >
        <Input
          id="transferred-at"
          type="datetime-local"
          value={transferredAt}
          max={toLocalInputValue(new Date())}
          onChange={(e) => setTransferredAt(e.target.value)}
          required
        />
      </Field>

      <Field
        label="Preuve de paiement (facultatif)"
        error={error ?? undefined}
        hint="Capture du transfert ou reçu. PNG, JPG ou PDF, 5 Mo maximum."
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={pickFile}
          className="sr-only"
          aria-label="Choisir un fichier de preuve"
        />

        {file ? (
          <div className="flex items-center gap-3 rounded-card border border-border bg-surface-alt p-3">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt=""
                className="size-14 shrink-0 rounded-control object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
                <FileText className="size-6" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-secondary">{file.fileName}</p>
              <p className="text-xs text-subtle-foreground">{formatSize(file.sizeBytes)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={removeFile}
              aria-label="Retirer le fichier"
            >
              <Trash2 />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-surface-alt px-4 py-6 text-center transition-colors hover:border-primary"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Upload className="size-5" aria-hidden />
            </span>
            <span className="text-base font-medium text-secondary">
              Ajouter une capture ou un reçu
            </span>
            <span className="text-xs text-muted-foreground">
              Accélère la confirmation, mais n’est pas obligatoire
            </span>
          </button>
        )}
      </Field>

      <div className="rounded-card bg-info-soft p-4">
        <p className="flex items-start gap-2.5 text-base leading-relaxed text-muted-foreground">
          <Paperclip className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
          Cette déclaration ne confirme pas le paiement : le psychologue vérifiera son compte avant
          de valider votre rendez-vous.
        </p>
      </div>

      <Button type="submit" size="lg" full loading={submitting}>
        <CheckCircle2 />
        J’ai effectué le paiement
      </Button>
    </form>
  );
}
