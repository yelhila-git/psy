'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Infinity as InfinityIcon,
  Lock as LockIcon,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { SubscriptionInvoice, SubscriptionPlan, SubscriptionWithPlan } from '@/types';
import { subscriptionService } from '@/lib/services';
import { planAvailability, quotaPercentage } from '@/lib/subscriptions';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { Progress, Separator } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';

/**
 * The practitioner's plan and quota.
 *
 * The quota meter is the point of the screen: it is the only thing a plan
 * actually buys, and hitting it removes the practitioner from search — so it
 * has to be visible well before it bites.
 */
export function SubscriptionPanel({
  psychologistId,
  initial,
  plans,
  invoices,
}: {
  psychologistId: string;
  initial: SubscriptionWithPlan | null;
  plans: SubscriptionPlan[];
  invoices: SubscriptionInvoice[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [subscription, setSubscription] = React.useState(initial);
  const [pending, setPending] = React.useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = React.useState(false);

  if (!subscription) {
    return (
      <Card className="p-8 text-center">
        <p className="text-base text-muted-foreground">
          Aucun abonnement rattaché à ce compte. Contactez le support pour en activer un.
        </p>
      </Card>
    );
  }

  /**
   * Only a change that costs nothing is settled here — a downgrade, or a move
   * to the free tier. Anything billable is sent to the CMI checkout, because
   * the plan must not change before the money is taken.
   */
  const selectPlan = async (plan: SubscriptionPlan) => {
    const quote = await subscriptionService.quote(psychologistId, plan.id);
    if (quote.paymentRequired) {
      router.push(`/dashboard/psychologist/subscription/checkout/${plan.id}`);
      return;
    }
    setPending(plan);
  };

  const confirmChange = async () => {
    if (!pending) return;
    setSaving(true);
    const updated = await subscriptionService.changePlan(psychologistId, pending.id);
    setSubscription(updated);
    setSaving(false);
    setPending(null);
    toast({
      title: `Formule ${pending.name} activée`,
      description:
        pending.monthlyQuota === null
          ? 'Vos consultations sont désormais illimitées.'
          : `Vous pouvez réaliser ${pending.monthlyQuota} consultations par mois.`,
      variant: 'success',
    });
  };

  const usage = quotaPercentage(subscription);
  const unlimited = subscription.plan.monthlyQuota === null;

  return (
    <>
      <Card
        className={cn(
          'p-6',
          subscription.canAcceptBookings ? 'border-success/40' : 'border-error/40',
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-secondary">
                Formule {subscription.plan.name}
              </h2>
              <Badge variant={subscription.canAcceptBookings ? 'success' : 'error'} size="sm">
                {subscription.canAcceptBookings ? 'Active' : 'Réservations bloquées'}
              </Badge>
            </div>
            <p className="mt-1 text-base text-muted-foreground">{subscription.plan.tagline}</p>

            <p className="mt-4 text-2xl font-bold text-secondary">
              {subscription.plan.pricePerMonth === 0
                ? 'Gratuit'
                : `${formatPrice(subscription.plan.pricePerMonth)} / mois`}
            </p>
            <p className="mt-1 text-xs text-subtle-foreground">
              Période en cours jusqu’au {formatDate(subscription.periodEnd)}
            </p>
          </div>

          <div className="w-full lg:max-w-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-medium text-secondary">Consultations ce mois</span>
              <span className="text-base font-bold text-secondary">
                {subscription.periodUsage}
                {unlimited ? '' : ` / ${subscription.plan.monthlyQuota}`}
              </span>
            </div>

            {unlimited ? (
              <p className="mt-2 flex items-center gap-1.5 text-base text-success">
                <InfinityIcon className="size-4" aria-hidden />
                Consultations illimitées
              </p>
            ) : (
              <>
                <Progress
                  value={usage}
                  className="mt-2"
                  indicatorClassName={
                    usage >= 100 ? 'bg-error' : usage >= 80 ? 'bg-warning' : 'bg-primary'
                  }
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {subscription.quotaRemaining === 0
                    ? 'Quota atteint — vous n’apparaissez plus dans la recherche.'
                    : `${subscription.quotaRemaining} consultations restantes`}
                </p>
              </>
            )}
          </div>
        </div>

        {!subscription.canAcceptBookings && (
          <p className="mt-5 flex items-start gap-2.5 rounded-card bg-error-soft p-4 text-base leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />
            Votre profil est retiré des résultats de recherche et aucun patient ne peut réserver.
            Vos rendez-vous déjà confirmés restent honorés.
          </p>
        )}
      </Card>

      <h2 className="mb-2 mt-8 flex items-center gap-2 text-md font-bold text-secondary">
        <Sparkles className="size-4 text-primary" aria-hidden />
        Changer de formule
      </h2>
      <p className="mb-4 text-base leading-relaxed text-muted-foreground">
        Vous pouvez monter en gamme à tout moment, en ne payant que la différence pour les jours
        restants. Le passage à une formule inférieure n’est possible qu’au renouvellement, le{' '}
        <span className="font-medium text-secondary">{formatDate(subscription.periodEnd)}</span> —
        le mois en cours vous est déjà acquis.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const current = plan.id === subscription.planId;
          const availability = planAvailability(subscription, plan);
          const locked = availability.reason === 'downgrade_locked';

          return (
            <Card
              key={plan.id}
              className={cn(
                'flex flex-col p-5',
                current && 'border-primary ring-1 ring-primary',
                locked && 'opacity-70',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-md font-bold text-secondary">{plan.name}</h3>
                {current && (
                  <Badge variant="primary" size="sm">
                    Actuelle
                  </Badge>
                )}
                {locked && (
                  <Badge variant="outline" size="sm">
                    <LockIcon aria-hidden />
                    Verrouillée
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-xl font-bold text-secondary">
                {plan.pricePerMonth === 0 ? 'Gratuit' : formatPrice(plan.pricePerMonth)}
                {plan.pricePerMonth > 0 && (
                  <span className="text-xs font-normal text-muted-foreground"> / mois</span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.tagline}</p>

              <Separator className="my-4" />

              <ul className="flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-base text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={availability.allowed ? 'default' : 'outline-muted'}
                full
                className="mt-5"
                disabled={!availability.allowed}
                title={
                  locked
                    ? `Disponible au renouvellement, le ${formatDate(availability.availableFrom!)}`
                    : undefined
                }
                onClick={() => void selectPlan(plan)}
              >
                {current ? (
                  'Formule actuelle'
                ) : locked ? (
                  <>
                    <LockIcon />
                    Indisponible
                  </>
                ) : plan.pricePerMonth > subscription.plan.pricePerMonth ? (
                  <>
                    <CreditCard />
                    Payer et activer
                  </>
                ) : (
                  'Choisir'
                )}
              </Button>

              {locked && (
                <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
                  Disponible à partir du {formatDate(availability.availableFrom!)}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-6 flex items-start gap-2.5 rounded-card bg-info-soft p-4 text-base leading-relaxed text-muted-foreground">
        <Zap className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        L’abonnement est la seule somme que vous versez à AlloMonPsy. Aucune commission n’est
        prélevée sur vos consultations : vos patients vous règlent directement et intégralement.
      </p>

      <InvoiceHistory invoices={invoices} />

      <Modal
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending ? `Passer à la formule ${pending.name} ?` : ''}
        description={
          pending
            ? `Ce changement ne donne lieu à aucun paiement et prend effet immédiatement. Aucun remboursement n’est effectué pour les jours déjà réglés sur votre formule actuelle.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline-muted" onClick={() => setPending(null)}>
              Annuler
            </Button>
            <Button onClick={confirmChange} loading={saving}>
              Confirmer le changement
            </Button>
          </>
        }
      />
    </>
  );
}

/**
 * Past subscription charges.
 *
 * The practitioner's only expense on the platform, so it deserves a real
 * receipt trail — including the failed attempts that explain an unpaid state.
 */
function InvoiceHistory({ invoices }: { invoices: SubscriptionInvoice[] }) {
  if (invoices.length === 0) return null;

  return (
    <Card className="mt-8 overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Receipt className="size-4 text-primary" aria-hidden />
          Historique de facturation
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {['Reçu', 'Formule', 'Période', 'Carte', 'Montant', 'Statut'].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-5 py-3 text-start text-2xs font-bold uppercase tracking-wider text-subtle-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="transition-colors hover:bg-muted/40">
                <td className="whitespace-nowrap px-5 py-4 font-mono text-base font-medium text-secondary">
                  {invoice.reference}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                  {invoice.planName}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                  {formatDate(invoice.periodStart)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-base text-muted-foreground">
                  {invoice.cardLast4 ? `•••• ${invoice.cardLast4}` : '—'}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-base font-bold text-secondary">
                  {formatPrice(invoice.amount, invoice.currency)}
                  {invoice.proratedDays ? (
                    <span className="ms-1.5 text-xs font-normal text-subtle-foreground">
                      prorata
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={
                      invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'failed'
                          ? 'error'
                          : 'warning'
                    }
                    size="sm"
                    title={invoice.failureReason}
                  >
                    {invoice.status === 'paid'
                      ? 'Payée'
                      : invoice.status === 'failed'
                        ? 'Refusée'
                        : 'En attente'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
