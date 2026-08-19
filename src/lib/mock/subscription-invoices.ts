import type { SubscriptionInvoice } from '@/types';
import { planById } from '@/lib/constants';
import { buildInvoiceReference } from '@/lib/subscriptions';
import { addDays, createRng, int, iso, startOfToday } from './seed';
import { subscriptions } from './subscriptions';

/**
 * Past subscription charges, one per month of the practitioner's tenure.
 *
 * A couple of failures are seeded on purpose: an unpaid charge is what turns a
 * subscription `past_due`, and that path has to be visible in the prototype
 * rather than being a state nobody can reach.
 */
export const subscriptionInvoices: SubscriptionInvoice[] = subscriptions.flatMap(
  (subscription, index) => {
    const plan = planById.get(subscription.planId);
    if (!plan || plan.pricePerMonth === 0) return [];

    const r = createRng(2700 + index * 29);
    const today = startOfToday();

    return [0, 1, 2].map((monthsAgo, i) => {
      const periodStart = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0);
      const failed = subscription.status === 'past_due' && monthsAgo === 0;

      return {
        id: `subinv-${subscription.psychologistId}-${monthsAgo}`,
        reference: buildInvoiceReference(index * 3 + i + 1, periodStart),
        psychologistId: subscription.psychologistId,
        planId: subscription.planId,
        planName: plan.name,
        amount: plan.pricePerMonth,
        fullAmount: plan.pricePerMonth,
        currency: plan.currency,
        status: failed ? 'failed' : 'paid',
        cardLast4: String(int(1000, 9999, r)),
        gatewayReference: `CMI-${int(100000, 999999, r)}`,
        periodStart: iso(periodStart),
        periodEnd: iso(periodEnd),
        issuedAt: iso(periodStart),
        paidAt: failed ? undefined : iso(addDays(periodStart, int(0, 2, r))),
        failureReason: failed ? 'Carte refusée par la banque émettrice' : undefined,
      } satisfies SubscriptionInvoice;
    });
  },
);

export const invoicesByPsychologist = new Map<string, SubscriptionInvoice[]>();
for (const invoice of subscriptionInvoices) {
  const list = invoicesByPsychologist.get(invoice.psychologistId) ?? [];
  list.push(invoice);
  invoicesByPsychologist.set(invoice.psychologistId, list);
}
