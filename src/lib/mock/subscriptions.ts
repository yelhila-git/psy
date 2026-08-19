import type { Subscription, SubscriptionPlanId, SubscriptionStatus } from '@/types';
import { planById } from '@/lib/constants';
import { addDays, createRng, int, iso, startOfToday } from './seed';
import { psychologists } from './psychologists';
import { appointments } from './appointments';

/**
 * A spread of plans and states across the roster, so every branch of the
 * gating logic is reachable in the prototype: a practitioner on the free tier
 * near their cap, one past due, one expired and therefore hidden from search.
 */
const PLAN_CYCLE: SubscriptionPlanId[] = ['pro', 'starter', 'premium', 'free', 'pro', 'starter'];

function statusFor(index: number): SubscriptionStatus {
  if (index === 5) return 'past_due';
  if (index === 9) return 'expired';
  return 'active';
}

/** Consultations booked by this practitioner inside the current month. */
function usageFor(psychologistId: string): number {
  const now = new Date();
  return appointments.filter((a) => {
    if (a.psychologistId !== psychologistId) return false;
    if (a.status === 'cancelled') return false;
    const start = new Date(a.startsAt);
    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
  }).length;
}

export const subscriptions: Subscription[] = psychologists
  .filter((p) => p.isVerified)
  .map((p, index) => {
    const r = createRng(4400 + index * 17);
    const today = startOfToday();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const planId = PLAN_CYCLE[index % PLAN_CYCLE.length]!;
    const status = statusFor(index);
    const quota = planById.get(planId)?.monthlyQuota ?? null;

    // Real usage, but capped so a seeded practitioner is never absurdly over
    // a quota they could not have exceeded.
    const usage = quota === null ? usageFor(p.id) : Math.min(usageFor(p.id), quota);

    return {
      id: `sub-${p.id}`,
      psychologistId: p.id,
      planId,
      status,
      startedAt: iso(addDays(today, -int(40, 500, r))),
      periodStart: iso(periodStart),
      periodEnd: iso(periodEnd),
      periodUsage: usage,
      cancelledAt: status === 'expired' ? iso(addDays(today, -int(3, 30, r))) : undefined,
    } satisfies Subscription;
  });

export const subscriptionByPsychologist = new Map(
  subscriptions.map((subscription) => [subscription.psychologistId, subscription]),
);
