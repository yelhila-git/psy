'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Lock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  SubscriptionChangeQuote,
  SubscriptionInvoice,
  SubscriptionPlan,
} from '@/types';
import { subscriptionService } from '@/lib/services';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/feedback';

type Stage = 'form' | 'processing' | 'success' | 'failure';

/** "4242 4242 4242 4242" while typing. */
function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/**
 * Subscription checkout.
 *
 * This is the one place money flows *to* the platform, so unlike consultation
 * payments it goes through a real gateway: a single CMI merchant account owned
 * by AlloMonPsy. The card number is posted to CMI and never persisted here —
 * only the last four digits come back, on the receipt.
 */
export function SubscriptionCheckout({
  psychologistId,
  plan,
}: {
  psychologistId: string;
  plan: SubscriptionPlan;
}) {
  const router = useRouter();

  const [quote, setQuote] = React.useState<SubscriptionChangeQuote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [stage, setStage] = React.useState<Stage>('form');
  const [invoice, setInvoice] = React.useState<SubscriptionInvoice | null>(null);
  const [simulate, setSimulate] = React.useState<'success' | 'failure'>('success');

  const [card, setCard] = React.useState({ number: '', expiry: '', cvc: '', holder: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    subscriptionService.quote(psychologistId, plan.id).then((result) => {
      if (cancelled) return;
      setQuote(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [psychologistId, plan.id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (card.number.replace(/\s/g, '').length !== 16) next.number = 'Numéro de carte incomplet';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) next.expiry = 'Format attendu : MM/AA';
    if (card.cvc.length < 3) next.cvc = 'Code à 3 chiffres';
    if (card.holder.trim().length < 3) next.holder = 'Nom du titulaire requis';
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setStage('processing');
    const result = await subscriptionService.pay({
      psychologistId,
      planId: plan.id,
      cardNumber: card.number,
      cardHolder: card.holder,
      expiry: card.expiry,
      cvc: card.cvc,
      simulate,
    });

    setInvoice(result.invoice);
    setStage(result.success ? 'success' : 'failure');
    // The card never survives the request.
    setCard({ number: '', expiry: '', cvc: '', holder: '' });
    if (result.success) router.refresh();
  };

  if (loading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <Card className="space-y-4 p-8">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
        <Card className="space-y-3 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <Card className="p-8 text-center text-base text-muted-foreground">
        Impossible de préparer le paiement pour cette formule.
      </Card>
    );
  }

  // Reached by typing the URL: a downgrade is never billable, so there is
  // nothing to charge and the plan is locked until the period ends.
  if (!quote.paymentRequired) {
    return (
      <Card className="p-8 text-center lg:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-subtle-foreground">
          <Lock className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-secondary">Changement indisponible</h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
          La formule {plan.name} est inférieure à votre formule actuelle. Elle redeviendra
          sélectionnable au renouvellement, le {formatDate(quote.periodEnd)} — le mois en cours
          vous est déjà acquis.
        </p>
        <Button size="lg" variant="outline-muted" className="mt-7" asChild>
          <Link href="/dashboard/psychologist/subscription">
            <ArrowLeft className="rtl-flip" />
            Retour aux formules
          </Link>
        </Button>
      </Card>
    );
  }

  if (stage === 'processing') return <Processing plan={plan} />;
  if (stage === 'success' && invoice) return <Success plan={plan} invoice={invoice} />;
  if (stage === 'failure' && invoice) {
    return <Failure invoice={invoice} onRetry={() => setStage('form')} />;
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
      <div className="min-w-0 space-y-6">
        <Card className="p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
              <CreditCard className="size-5 text-primary" aria-hidden />
              Paiement par carte bancaire
            </h2>
            <Badge variant="secondary" size="sm">
              CMI
            </Badge>
          </div>
          <p className="mt-1.5 text-base text-muted-foreground">
            Cartes marocaines et internationales : CMI, Visa, Mastercard.
          </p>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Numéro de carte"
              htmlFor="card-number"
              error={errors.number}
              required
              className="sm:col-span-2"
            >
              <Input
                id="card-number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={card.number}
                invalid={Boolean(errors.number)}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                endAdornment={<CreditCard />}
              />
            </Field>

            <Field label="Expiration" htmlFor="card-expiry" error={errors.expiry} required>
              <Input
                id="card-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={card.expiry}
                invalid={Boolean(errors.expiry)}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              />
            </Field>

            <Field label="Cryptogramme" htmlFor="card-cvc" error={errors.cvc} required>
              <Input
                id="card-cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={card.cvc}
                invalid={Boolean(errors.cvc)}
                onChange={(e) =>
                  setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
              />
            </Field>

            <Field
              label="Titulaire de la carte"
              htmlFor="card-holder"
              error={errors.holder}
              required
              className="sm:col-span-2"
            >
              <Input
                id="card-holder"
                autoComplete="cc-name"
                placeholder="Nom inscrit sur la carte"
                value={card.holder}
                invalid={Boolean(errors.holder)}
                onChange={(e) => setCard({ ...card, holder: e.target.value })}
              />
            </Field>
          </div>

          <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Vos données bancaires sont transmises directement à CMI. Elles ne transitent pas par nos
            serveurs et ne sont pas conservées : seuls les quatre derniers chiffres figurent sur
            votre reçu.
          </p>
        </Card>

        {/* Without a bank behind it, the failure path would be unreachable. */}
        <Card className="border-dashed border-warning/50 bg-warning-soft/30 p-5">
          <p className="flex items-center gap-2 text-base font-semibold text-secondary">
            <FlaskConical className="size-4 text-warning" aria-hidden />
            Environnement de démonstration
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Aucune transaction réelle n’est effectuée et aucune carte n’est débitée. Choisissez le
            résultat que doit renvoyer la passerelle pour tester les deux parcours.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['success', 'failure'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSimulate(value)}
                aria-pressed={simulate === value}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  simulate === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary',
                )}
              >
                {value === 'success' ? 'Paiement accepté' : 'Paiement refusé'}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <OrderSummary plan={plan} quote={quote} />
    </form>
  );
}

// ---------------------------------------------------------------------------

function OrderSummary({
  plan,
  quote,
}: {
  plan: SubscriptionPlan;
  quote: SubscriptionChangeQuote;
}) {
  return (
    <aside>
      <Card className="sticky top-28 p-6">
        <h2 className="text-md font-bold text-secondary">Récapitulatif</h2>

        <div className="mt-5">
          <p className="text-lg font-bold text-secondary">Formule {plan.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>
        </div>

        <Separator className="my-5" />

        <dl className="space-y-3 text-base">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tarif mensuel</dt>
            <dd className="font-medium text-secondary">{formatPrice(plan.pricePerMonth)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quota</dt>
            <dd className="font-medium text-secondary">
              {plan.monthlyQuota === null ? 'Illimité' : `${plan.monthlyQuota} / mois`}
            </dd>
          </div>
          {quote.prorated && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Jours restants</dt>
              <dd className="font-medium text-secondary">
                {quote.remainingDays} / {quote.periodDays}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Période en cours</dt>
            <dd className="text-end font-medium text-secondary">
              jusqu’au {formatDate(quote.periodEnd)}
            </dd>
          </div>
        </dl>

        <Separator className="my-5" />

        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-secondary">À régler</span>
          <span className="text-xl font-bold text-secondary">{formatPrice(quote.amount)}</span>
        </div>

        {quote.prorated && (
          <p className="mt-2 rounded-card bg-info-soft p-3 text-xs leading-relaxed text-muted-foreground">
            Vous ne payez que la différence pour les {quote.remainingDays} jours restants. Le tarif
            plein de {formatPrice(plan.pricePerMonth)} s’appliquera au prochain renouvellement.
          </p>
        )}

        <Button type="submit" size="lg" full className="mt-6">
          <Lock />
          Payer {formatPrice(quote.amount)}
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-subtle-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          Le nouveau quota s’applique dès la validation du paiement.
        </p>
      </Card>
    </aside>
  );
}

function Processing({ plan }: { plan: SubscriptionPlan }) {
  return (
    <Card className="p-10 text-center">
      <span className="mx-auto flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2.5 animate-pulse rounded-full bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <h2 className="mt-6 text-xl font-bold text-secondary">Paiement en cours</h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        Connexion sécurisée à CMI pour la formule {plan.name}. Ne fermez pas cette page.
      </p>
    </Card>
  );
}

function Success({ plan, invoice }: { plan: SubscriptionPlan; invoice: SubscriptionInvoice }) {
  return (
    <Card className="p-8 text-center lg:p-10">
      <span className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success/30" aria-hidden />
        <CheckCircle2 className="relative size-8" aria-hidden />
      </span>

      <h2 className="mt-5 text-2xl font-bold text-secondary">Paiement confirmé</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        La formule {plan.name} est active.{' '}
        {plan.monthlyQuota === null
          ? 'Vos consultations sont désormais illimitées.'
          : `Vous pouvez réaliser ${plan.monthlyQuota} consultations par mois.`}
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-card bg-surface-alt p-4 text-start">
        <dl className="space-y-2.5">
          <Row label="Reçu" value={invoice.reference} />
          <Row label="Montant" value={formatPrice(invoice.amount, invoice.currency)} />
          {invoice.cardLast4 && <Row label="Carte" value={`•••• ${invoice.cardLast4}`} />}
          {invoice.gatewayReference && (
            <Row label="Transaction" value={invoice.gatewayReference} />
          )}
        </dl>
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/dashboard/psychologist/subscription">Voir mon abonnement</Link>
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/dashboard/psychologist">Retour au tableau de bord</Link>
        </Button>
      </div>
    </Card>
  );
}

function Failure({ invoice, onRetry }: { invoice: SubscriptionInvoice; onRetry: () => void }) {
  return (
    <Card className="p-8 text-center lg:p-10">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-error-soft text-error">
        <XCircle className="size-8" aria-hidden />
      </span>

      <h2 className="mt-5 text-2xl font-bold text-secondary">Paiement refusé</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        {invoice.failureReason ?? 'La transaction n’a pas abouti.'} Votre formule actuelle reste
        inchangée et aucun montant n’a été débité.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={onRetry}>
          Réessayer
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/dashboard/psychologist/subscription">
            <ArrowLeft className="rtl-flip" />
            Retour aux formules
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-end text-base font-medium text-secondary">{value}</dd>
    </div>
  );
}
