'use client';

import * as React from 'react';
import { Eye, EyeOff, Landmark, Lock, Save, ShieldCheck, Zap } from 'lucide-react';
import type { PsychologistPaymentInfo } from '@/types';
import { paymentService } from '@/lib/services';
import {
  DEFAULT_TRANSFER_METHOD,
  MOROCCAN_BANKS,
  TRANSFER_METHOD_HINT,
  TRANSFER_METHOD_LABELS,
} from '@/lib/constants';
import { acceptsBookings, formatRib, visibleInstructions } from '@/lib/payments';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Checkbox, Separator, Switch } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

type Draft = Omit<PsychologistPaymentInfo, 'psychologistId' | 'updatedAt'>;

const EMPTY: Draft = {
  accountHolderName: '',
  bankName: MOROCCAN_BANKS[0],
  rib: '',
  iban: '',
  phone: '',
  visibility: { rib: true, iban: false },
  instructions: '',
  isActive: false,
};

/**
 * The practitioner's transfer coordinates.
 *
 * They decide which fields a patient sees, so the form previews exactly what
 * will be shown rather than describing it — the difference between a hidden
 * phone number and a published one is not something to leave to imagination.
 */
export function PaymentInfoForm({
  psychologistId,
  initial,
}: {
  psychologistId: string;
  initial: PsychologistPaymentInfo | null;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = React.useState<Draft>(() => (initial ? { ...initial } : EMPTY));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (draft.accountHolderName.trim().length < 3) next.accountHolderName = 'Nom du titulaire requis';
    if (!draft.bankName) next.bankName = 'Banque requise';

    const rib = draft.rib.replace(/\s/g, '');
    if (rib && !/^\d{16,24}$/.test(rib)) next.rib = 'Le RIB doit contenir 16 à 24 chiffres';
    if (draft.visibility.rib && !rib) next.rib = 'RIB requis pour être affiché au patient';
    if (draft.visibility.iban && !draft.iban?.trim()) next.iban = 'IBAN requis pour être affiché';

    // The transfer is sent to this number: without it there is no way to pay.
    if (draft.phone.replace(/\D/g, '').length < 9) {
      next.phone = 'Numéro de réception requis pour recevoir les transferts';
    }
    return next;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSaving(true);
    await paymentService.updatePaymentInfo(psychologistId, {
      ...draft,
      rib: draft.rib.replace(/\s/g, ''),
    });
    setSaving(false);
    toast({
      title: 'Informations enregistrées',
      description: draft.isActive
        ? 'Vos patients verront ces coordonnées après avoir réservé.'
        : 'Vos coordonnées sont enregistrées mais inactives : les réservations restent bloquées.',
      variant: draft.isActive ? 'success' : 'warning',
    });
  };

  const preview = visibleInstructions({ ...draft, psychologistId, updatedAt: '' });
  const live = acceptsBookings({ ...draft, psychologistId, updatedAt: '' });

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-6">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <Landmark className="size-4 text-primary" aria-hidden />
            Compte destinataire
          </h2>
          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Numéro de réception"
              htmlFor="phone"
              error={errors.phone}
              hint="Le numéro auquel vos patients enverront le transfert instantané."
              required
              className="sm:col-span-2"
            >
              <Input
                id="phone"
                type="tel"
                value={draft.phone}
                invalid={Boolean(errors.phone)}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </Field>

            <Field
              label="Nom du titulaire"
              htmlFor="holder"
              error={errors.accountHolderName}
              required
              className="sm:col-span-2"
            >
              <Input
                id="holder"
                value={draft.accountHolderName}
                invalid={Boolean(errors.accountHolderName)}
                onChange={(e) => set('accountHolderName', e.target.value)}
                placeholder="Tel qu’inscrit sur le compte bancaire"
              />
            </Field>

            <Field label="Banque" error={errors.bankName} required className="sm:col-span-2">
              <Select value={draft.bankName} onValueChange={(value) => set('bankName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une banque" />
                </SelectTrigger>
                <SelectContent>
                  {MOROCCAN_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="RIB"
              htmlFor="rib"
              error={errors.rib}
              hint="24 chiffres, sans espaces"
              className="sm:col-span-2"
            >
              <Input
                id="rib"
                inputMode="numeric"
                value={draft.rib}
                invalid={Boolean(errors.rib)}
                onChange={(e) => set('rib', e.target.value.replace(/\D/g, '').slice(0, 24))}
                placeholder="230780123456789012345678"
                className="font-mono"
              />
            </Field>

            <Field
              label="IBAN (facultatif)"
              htmlFor="iban"
              error={errors.iban}
              className="sm:col-span-2"
            >
              <Input
                id="iban"
                value={draft.iban ?? ''}
                invalid={Boolean(errors.iban)}
                onChange={(e) => set('iban', e.target.value.toUpperCase())}
                placeholder="MA64…"
                className="font-mono"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-md font-bold text-secondary">Méthode de transfert</h2>
          <Separator className="my-5" />

          <div className="flex items-start gap-3 rounded-card border border-primary bg-primary-soft/40 p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <Zap className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-secondary">
                {TRANSFER_METHOD_LABELS[DEFAULT_TRANSFER_METHOD]}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {TRANSFER_METHOD_HINT}. C’est la seule méthode acceptée sur AlloMonPsy.
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <Field
            label="Note affichée au patient (facultatif)"
            htmlFor="instructions"
            hint="Une consigne courte : délai de confirmation, préférence de méthode…"
          >
            <Textarea
              id="instructions"
              value={draft.instructions ?? ''}
              onChange={(e) => set('instructions', e.target.value)}
              maxLength={280}
              placeholder="Merci d’indiquer la référence de la réservation dans le motif du transfert."
              className="min-h-[90px]"
            />
          </Field>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <Eye className="size-4 text-primary" aria-hidden />
            Coordonnées visibles par le patient
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
            Votre numéro de réception, votre nom et votre banque sont toujours affichés — sans eux
            le patient ne peut pas vous payer. Le reste est à votre choix.
          </p>
          <Separator className="my-5" />

          <div className="space-y-4">
            <VisibilityToggle
              label="Afficher le RIB"
              hint="Pour les patients qui préfèrent un transfert de compte à compte."
              checked={draft.visibility.rib}
              onChange={(checked) => set('visibility', { ...draft.visibility, rib: checked })}
            />
            <VisibilityToggle
              label="Afficher l’IBAN"
              hint="Utile pour les transferts depuis l’étranger."
              checked={draft.visibility.iban}
              onChange={(checked) => set('visibility', { ...draft.visibility, iban: checked })}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className={cn('p-6', live ? 'border-success/40' : 'border-warning/40')}>
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <ShieldCheck className={cn('size-4', live ? 'text-success' : 'text-warning')} aria-hidden />
            Activation
          </h2>
          <Separator className="my-5" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-secondary">Accepter les réservations</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Désactivé, votre profil reste visible mais aucun patient ne peut réserver.
              </p>
            </div>
            <Switch
              checked={draft.isActive}
              onCheckedChange={(checked) => set('isActive', checked)}
              aria-label="Accepter les réservations"
            />
          </div>

          <Badge variant={live ? 'success' : 'warning'} size="sm" className="mt-4">
            {live ? 'Réservations ouvertes' : 'Réservations bloquées'}
          </Badge>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            {draft.isActive ? (
              <Eye className="size-4 text-primary" aria-hidden />
            ) : (
              <EyeOff className="size-4 text-subtle-foreground" aria-hidden />
            )}
            Ce que verra le patient
          </h2>
          <Separator className="my-5" />

          <dl className="space-y-3">
            <PreviewRow label="Numéro de réception" value={preview.phone || '—'} />
            <PreviewRow label="Nom" value={preview.accountHolderName || '—'} />
            <PreviewRow label="Banque" value={preview.bankName || '—'} />
            {preview.rib && <PreviewRow label="RIB" value={formatRib(preview.rib)} mono />}
            {preview.iban && <PreviewRow label="IBAN" value={preview.iban} mono />}
          </dl>

          {!preview.phone && (
            <p className="mt-4 rounded-card bg-warning-soft p-3.5 text-base leading-relaxed text-muted-foreground">
              Sans numéro de réception, le patient n’a aucun moyen de vous envoyer le transfert.
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-subtle-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            Ces informations n’apparaissent jamais sur votre profil public. Seul un patient ayant
            réservé une consultation avec vous peut les consulter.
          </p>
        </Card>

        <Button type="submit" size="lg" full loading={saving}>
          <Save />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function VisibilityToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-base font-medium text-secondary">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-base text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'break-all text-end text-base font-medium text-secondary',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
