'use client';

import { Landmark, Lock, ShieldCheck, Zap } from 'lucide-react';
import type { PaymentInstructions as Instructions } from '@/types';
import { DEFAULT_TRANSFER_METHOD, TRANSFER_METHOD_HINT, TRANSFER_METHOD_LABELS } from '@/lib/constants';
import { formatRib } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/misc';
import { CopyField } from './copy-field';

/**
 * The practitioner's transfer coordinates.
 *
 * Reached only from a booking the patient owns, and already filtered down to
 * the fields the practitioner agreed to expose — these details are never part
 * of a public profile.
 */
export function PaymentInstructionsCard({
  instructions,
  amount,
  currency,
  reference,
  psychologistName,
}: {
  instructions: Instructions;
  amount: number;
  currency: string;
  reference: string;
  psychologistName: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
        <Landmark className="size-5 text-primary" aria-hidden />
        Informations de paiement
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        Effectuez le transfert directement à {psychologistName}, puis déclarez-le ci-dessous.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <Badge variant="primary" size="sm">
          <Zap aria-hidden />
          {TRANSFER_METHOD_LABELS[DEFAULT_TRANSFER_METHOD]}
        </Badge>
        <span className="text-xs text-muted-foreground">{TRANSFER_METHOD_HINT}</span>
      </div>

      <div className="mt-5 space-y-2.5">
        {/* The number the transfer is sent to leads: it is the coordinate the
            patient actually types into the transfer app. */}
        <CopyField label="Numéro de téléphone" value={instructions.phone} emphasis />
        <CopyField label="Nom du bénéficiaire" value={instructions.accountHolderName} />
        <CopyField label="Banque" value={instructions.bankName} />

        {instructions.rib && (
          <CopyField label="RIB" value={formatRib(instructions.rib)} copyValue={instructions.rib} mono />
        )}
        {instructions.iban && <CopyField label="IBAN" value={instructions.iban} mono />}
      </div>

      <Separator className="my-5" />

      <div className="space-y-2.5">
        <CopyField
          label="Montant à transférer"
          value={formatPrice(amount, currency)}
          copyValue={String(amount / 100)}
          emphasis
        />
        <CopyField label="Référence à indiquer" value={reference} mono emphasis />
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-card bg-warning-soft p-4 text-base leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        Indiquez impérativement la référence <strong className="text-secondary">{reference}</strong>{' '}
        dans le motif du transfert. Sans elle, le psychologue ne pourra pas rattacher le paiement à
        votre rendez-vous.
      </p>

      {instructions.instructions && (
        <p className="mt-3 rounded-card bg-surface-alt p-4 text-base leading-relaxed text-muted-foreground">
          <span className="font-medium text-secondary">Note du psychologue : </span>
          {instructions.instructions}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-subtle-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        Ces coordonnées vous sont communiquées uniquement pour ce rendez-vous. AlloMonPsy
        n’encaisse aucun paiement et ne conserve aucune donnée bancaire vous concernant.
      </p>
    </div>
  );
}
