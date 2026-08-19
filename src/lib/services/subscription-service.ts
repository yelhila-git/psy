import type {
  ID,
  SubscriptionChangeQuote,
  SubscriptionInvoice,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionWithPlan,
} from '@/types';
import { api, isLive } from '@/lib/api-client';
import { delay } from '@/lib/utils';
import { SUBSCRIPTION_PLANS, planById } from '@/lib/constants';
import {
  buildInvoiceReference,
  isSubscriptionActive,
  planAvailability,
  quoteChange,
  resolveSubscription,
} from '@/lib/subscriptions';
import { subscriptions, subscriptionByPsychologist } from '@/lib/mock/subscriptions';
import {
  invoicesByPsychologist,
  subscriptionInvoices,
} from '@/lib/mock/subscription-invoices';

export interface PaySubscriptionInput {
  psychologistId: ID;
  planId: SubscriptionPlanId;
  /** Sent to the gateway, never stored — only the last four digits are kept. */
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvc: string;
  /** Demo-only lever so the failure path stays reachable without a real bank. */
  simulate?: 'success' | 'failure';
}

export interface SubscriptionPaymentResult {
  success: boolean;
  invoice: SubscriptionInvoice;
  subscription: SubscriptionWithPlan;
}

export const subscriptionService = {
  /** GET /api/subscription-plans — admin-editable, hence fetched not hardcoded. */
  async plans(): Promise<SubscriptionPlan[]> {
    if (isLive('subscriptions')) return api.get<SubscriptionPlan[]>('/subscription-plans');
    await delay(120);
    return SUBSCRIPTION_PLANS;
  },

  /** GET /api/psychologists/{id}/subscription */
  async forPsychologist(psychologistId: ID): Promise<SubscriptionWithPlan | null> {
    if (isLive('subscriptions')) {
      return api
        .get<SubscriptionWithPlan>(`/psychologists/${psychologistId}/subscription`)
        .catch(() => null);
    }
    await delay(150);
    const found = subscriptionByPsychologist.get(psychologistId);
    return found ? resolveSubscription(found) : null;
  },

  /**
   * Whether a practitioner can take a new booking right now.
   *
   * Both an expired subscription and an exhausted monthly quota close the
   * door; callers only care that it is closed. A practitioner with no
   * subscription record at all cannot be booked either.
   */
  async canAcceptBookings(psychologistId: ID): Promise<boolean> {
    const subscription = await this.forPsychologist(psychologistId);
    return subscription?.canAcceptBookings ?? false;
  },

  /**
   * GET /api/psychologists/{id}/subscription/quote?plan_id=…
   *
   * What the change costs before committing to it. The amount is computed
   * server-side and echoed back on the charge, so the price shown and the
   * price taken can never diverge.
   */
  async quote(psychologistId: ID, planId: SubscriptionPlanId): Promise<SubscriptionChangeQuote> {
    if (isLive('subscriptions')) {
      return api.get<SubscriptionChangeQuote>(
        `/psychologists/${psychologistId}/subscription/quote`,
        { params: { plan_id: planId } },
      );
    }
    await delay(180);

    const existing = subscriptionByPsychologist.get(psychologistId);
    const plan = planById.get(planId);
    if (!existing || !plan) throw new Error('Abonnement ou formule introuvable');
    return quoteChange(resolveSubscription(existing), plan);
  },

  /**
   * POST /api/psychologists/{id}/subscription — plan change without a charge.
   *
   * Only valid when the quote says no payment is due: a downgrade or a move to
   * the free tier. Anything billable must go through `pay`.
   */
  async changePlan(psychologistId: ID, planId: SubscriptionPlanId): Promise<SubscriptionWithPlan> {
    if (isLive('subscriptions')) {
      return api.post<SubscriptionWithPlan>(`/psychologists/${psychologistId}/subscription`, {
        plan_id: planId,
      });
    }
    await delay(600);

    const existing = subscriptionByPsychologist.get(psychologistId);
    const plan = planById.get(planId);
    if (!existing || !plan) throw new Error('Abonnement ou formule introuvable');

    const availability = planAvailability(resolveSubscription(existing), plan);
    if (!availability.allowed) {
      throw new Error(
        availability.reason === 'downgrade_locked'
          ? 'Formule inférieure indisponible avant la fin de la période en cours'
          : 'Formule déjà active',
      );
    }

    const quote = await this.quote(psychologistId, planId);
    if (quote.paymentRequired) {
      throw new Error('Cette formule nécessite un paiement');
    }

    existing.planId = planId;
    existing.status = 'active';
    existing.cancelledAt = undefined;
    return resolveSubscription(existing);
  },

  /**
   * POST /api/psychologists/{id}/subscription/pay
   *
   * Charges the card through CMI and activates the plan on success.
   *
   * In mock mode the gateway round-trip is simulated and its outcome is
   * forced by `simulate`, so the failure path — the one that produces an
   * unpaid subscription — stays reachable. Card details never leave this
   * function: only the last four digits are kept, exactly as a real
   * integration would, since the PAN goes straight to CMI.
   */
  async pay(input: PaySubscriptionInput): Promise<SubscriptionPaymentResult> {
    if (isLive('subscriptions')) {
      return api.post<SubscriptionPaymentResult>(
        `/psychologists/${input.psychologistId}/subscription/pay`,
        { plan_id: input.planId },
      );
    }
    // Stands in for the redirect to CMI and back.
    await delay(1800);

    const existing = subscriptionByPsychologist.get(input.psychologistId);
    const plan = planById.get(input.planId);
    if (!existing || !plan) throw new Error('Abonnement ou formule introuvable');

    // Checked here too: a locked downgrade must not become reachable just by
    // opening the checkout URL directly.
    const availability = planAvailability(resolveSubscription(existing), plan);
    if (!availability.allowed) {
      throw new Error(
        availability.reason === 'downgrade_locked'
          ? 'Formule inférieure indisponible avant la fin de la période en cours'
          : 'Formule déjà active',
      );
    }

    const quote = quoteChange(resolveSubscription(existing), plan);
    const now = new Date();
    const succeeded = input.simulate !== 'failure';

    const invoice: SubscriptionInvoice = {
      id: `subinv-new-${now.getTime()}`,
      reference: buildInvoiceReference(subscriptionInvoices.length + 1, now),
      psychologistId: input.psychologistId,
      planId: plan.id,
      planName: plan.name,
      amount: quote.amount,
      fullAmount: plan.pricePerMonth,
      proratedDays: quote.prorated ? quote.remainingDays : undefined,
      currency: plan.currency,
      status: succeeded ? 'paid' : 'failed',
      cardLast4: input.cardNumber.replace(/\D/g, '').slice(-4),
      gatewayReference: `CMI-${String(now.getTime()).slice(-6)}`,
      periodStart: existing.periodStart,
      periodEnd: existing.periodEnd,
      issuedAt: now.toISOString(),
      paidAt: succeeded ? now.toISOString() : undefined,
      failureReason: succeeded ? undefined : 'Carte refusée par la banque émettrice',
    };

    subscriptionInvoices.push(invoice);
    const list = invoicesByPsychologist.get(input.psychologistId) ?? [];
    invoicesByPsychologist.set(input.psychologistId, [...list, invoice]);

    if (!succeeded) {
      return { success: false, invoice, subscription: resolveSubscription(existing) };
    }

    // Reactivating a lapsed plan opens a fresh period; an upgrade keeps the
    // current one, which is what the prorated amount paid for.
    if (!isSubscriptionActive(existing.status)) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      existing.periodStart = start.toISOString();
      existing.periodEnd = end.toISOString();
      existing.periodUsage = 0;
    }

    existing.planId = plan.id;
    existing.status = 'active';
    existing.cancelledAt = undefined;

    return { success: true, invoice, subscription: resolveSubscription(existing) };
  },

  /** GET /api/psychologists/{id}/subscription/invoices */
  async invoices(psychologistId: ID): Promise<SubscriptionInvoice[]> {
    if (isLive('subscriptions')) {
      return api.get<SubscriptionInvoice[]>(
        `/psychologists/${psychologistId}/subscription/invoices`,
      );
    }
    await delay(160);
    return [...(invoicesByPsychologist.get(psychologistId) ?? [])].sort((a, b) =>
      b.issuedAt.localeCompare(a.issuedAt),
    );
  },

  /** POST /api/psychologists/{id}/subscription/cancel */
  async cancel(psychologistId: ID): Promise<SubscriptionWithPlan | null> {
    if (isLive('subscriptions')) {
      return api.post<SubscriptionWithPlan>(`/psychologists/${psychologistId}/subscription/cancel`);
    }
    await delay(500);

    const existing = subscriptionByPsychologist.get(psychologistId);
    if (!existing) return null;
    existing.status = 'cancelled';
    existing.cancelledAt = new Date().toISOString();
    return resolveSubscription(existing);
  },

  /** Ids of practitioners currently open to bookings — powers the marketplace. */
  async bookablePsychologistIds(): Promise<Set<ID>> {
    if (isLive('subscriptions')) {
      const ids = await api.get<ID[]>('/subscriptions/bookable');
      return new Set(ids);
    }
    await delay(80);
    return new Set(
      subscriptions
        .map(resolveSubscription)
        .filter((subscription) => subscription.canAcceptBookings)
        .map((subscription) => subscription.psychologistId),
    );
  },

  /** Monthly recurring revenue across every live subscription, in centimes. */
  async monthlyRecurringRevenue(): Promise<number> {
    if (isLive('subscriptions')) return api.get<number>('/admin/subscriptions/mrr');
    await delay(100);
    return subscriptions
      .map(resolveSubscription)
      .filter((subscription) => subscription.status === 'active')
      .reduce((sum, subscription) => sum + (planById.get(subscription.planId)?.pricePerMonth ?? 0), 0);
  },
};
