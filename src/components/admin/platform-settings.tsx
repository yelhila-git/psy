'use client';

import * as React from 'react';
import { AlertTriangle, Repeat, Save, ShieldCheck, Sliders, Wallet } from 'lucide-react';
import {
  PAYMENT_WINDOW_MINUTES,
  PAYMENT_WINDOW_OPTIONS,
  PRICE_RANGE,
  SITE,
  SUBSCRIPTION_PLANS,
} from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Separator, Switch } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

export function PlatformSettings() {
  const { toast } = useToast();

  const [plans, setPlans] = React.useState(SUBSCRIPTION_PLANS);
  const [minPrice, setMinPrice] = React.useState<number>(15000);
  const [maxPrice, setMaxPrice] = React.useState<number>(PRICE_RANGE.max);
  const [cancellationHours, setCancellationHours] = React.useState('24');
  const [paymentWindow, setPaymentWindow] = React.useState(String(PAYMENT_WINDOW_MINUTES));
  const [autoApprove, setAutoApprove] = React.useState(false);
  const [requireInsurance, setRequireInsurance] = React.useState(false);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [supportEmail, setSupportEmail] = React.useState<string>(SITE.email);
  const [emergencyNotice, setEmergencyNotice] = React.useState(
    "AlloMonPsy n'est pas un service d'urgence. En cas de danger immédiat, contactez les secours (141) ou rendez-vous aux urgences les plus proches.",
  );
  const [saving, setSaving] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast({
      title: 'Paramètres enregistrés',
      description: 'Les nouvelles règles s’appliquent aux prochaines réservations.',
      variant: 'success',
    });
  };

  const setPlan = (id: string, patch: Partial<(typeof plans)[number]>) =>
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...plan, ...patch } : plan)));

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-2">
      <Card className="p-6 xl:col-span-2">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Repeat className="size-4 text-primary" aria-hidden />
          Formules d’abonnement
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
          L’abonnement des praticiens est l’unique source de revenus. Aucune commission n’est
          prélevée sur les consultations : les honoraires vont directement du patient au
          psychologue.
        </p>
        <Separator className="my-5" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-card border border-border p-4">
              <p className="text-base font-bold text-secondary">{plan.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>

              <Field label="Prix mensuel (MAD)" htmlFor={`price-${plan.id}`} className="mt-4">
                <Input
                  id={`price-${plan.id}`}
                  type="number"
                  min={0}
                  step={50}
                  value={plan.pricePerMonth / 100}
                  onChange={(e) => setPlan(plan.id, { pricePerMonth: Number(e.target.value) * 100 })}
                />
              </Field>

              <Field
                label="Consultations / mois"
                htmlFor={`quota-${plan.id}`}
                hint="Laisser vide pour illimité"
                className="mt-3"
              >
                <Input
                  id={`quota-${plan.id}`}
                  type="number"
                  min={0}
                  value={plan.monthlyQuota ?? ''}
                  placeholder="Illimité"
                  onChange={(e) =>
                    setPlan(plan.id, {
                      monthlyQuota: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Wallet className="size-4 text-primary" aria-hidden />
          Tarifs des consultations
        </h2>
        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
          Bornes que les praticiens doivent respecter en fixant leurs honoraires.
        </p>
        <Separator className="my-5" />

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tarif minimum autorisé (MAD)" htmlFor="minPrice">
              <Input
                id="minPrice"
                type="number"
                min={0}
                step={25}
                value={minPrice / 100}
                onChange={(e) => setMinPrice(Number(e.target.value) * 100)}
              />
            </Field>
            <Field label="Tarif maximum autorisé (MAD)" htmlFor="maxPrice">
              <Input
                id="maxPrice"
                type="number"
                min={0}
                step={25}
                value={maxPrice / 100}
                onChange={(e) => setMaxPrice(Number(e.target.value) * 100)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Sliders className="size-4 text-primary" aria-hidden />
          Règles de réservation
        </h2>
        <Separator className="my-5" />

        <Field
          label="Délai de paiement"
          hint="Temps laissé au patient pour effectuer son transfert et le déclarer. Passé ce délai, la réservation est annulée et le créneau libéré."
        >
          <Select value={paymentWindow} onValueChange={setPaymentWindow}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_WINDOW_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} minutes après la réservation
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Separator className="my-5" />

        <Field
          label="Délai d’annulation gratuite"
          hint="Au-delà de ce délai, la consultation reste due au praticien."
        >
          <Select value={cancellationHours} onValueChange={setCancellationHours}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['12', '24', '48', '72'].map((value) => (
                <SelectItem key={value} value={value}>
                  {value} heures avant la séance
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Separator className="my-5" />

        <div className="space-y-4">
          <Toggle
            label="Mode maintenance"
            hint="Affiche une page d’indisponibilité et bloque les nouvelles réservations."
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          Vérification des praticiens
        </h2>
        <Separator className="my-5" />

        <div className="space-y-4">
          <Toggle
            label="Approbation automatique"
            hint="Déconseillé : les profils seraient publiés sans contrôle humain des diplômes."
            checked={autoApprove}
            onChange={setAutoApprove}
          />
          <Toggle
            label="Assurance RC professionnelle obligatoire"
            hint="Ajoute l’attestation d’assurance aux documents requis à l’inscription."
            checked={requireInsurance}
            onChange={setRequireInsurance}
          />
        </div>

        {autoApprove && (
          <p className="mt-5 flex items-start gap-2.5 rounded-card bg-warning-soft p-4 text-base leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            L’approbation automatique met en ligne des praticiens dont les diplômes n’ont pas été
            contrôlés. Sur une plateforme de santé mentale, cela engage votre responsabilité.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-md font-bold text-secondary">Contenus et contact</h2>
        <Separator className="my-5" />

        <div className="space-y-4">
          <Field label="E-mail du support" htmlFor="supportEmail">
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </Field>

          <Field
            label="Avertissement d’urgence"
            htmlFor="emergency"
            hint="Affiché en pied de page et dans la FAQ. Ce message a une portée légale — modifiez-le avec précaution."
          >
            <Textarea
              id="emergency"
              value={emergencyNotice}
              onChange={(e) => setEmergencyNotice(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="xl:col-span-2">
        <Button type="submit" size="lg" loading={saving}>
          <Save />
          Enregistrer les paramètres
        </Button>
      </div>
    </form>
  );
}

function Toggle({
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
