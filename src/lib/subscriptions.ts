/**
 * Subscription rules — the platform's only revenue mechanic.
 *
 * Practitioners pay monthly; patients never pay the platform and no commission
 * is taken on any consultation. What a plan buys is a monthly consultation
 * quota, so quota arithmetic is the whole of the gating logic and lives here,
 * pure and testable, rather than being scattered across pages.
 */

import type {
  Subscription,
  SubscriptionChangeQuote,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionWithPlan,
} from '@/types';
import { planById, SUBSCRIPTION_PLANS } from '@/lib/constants';

/** A subscription in good standing. `past_due` still serves, with a warning. */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'past_due';
}

/** Consultations left in the current period; null when the plan is unlimited. */
export function quotaRemaining(
  subscription: Pick<Subscription, 'periodUsage'>,
  plan: Pick<SubscriptionPlan, 'monthlyQuota'>,
): number | null {
  if (plan.monthlyQuota === null) return null;
  return Math.max(0, plan.monthlyQuota - subscription.periodUsage);
}

/**
 * Resolves a subscription against its plan.
 *
 * `canAcceptBookings` is the single fact the rest of the app asks for: an
 * expired subscription or an exhausted quota both close the practitioner to
 * new bookings, and callers should not have to know which.
 */
export function resolveSubscription(subscription: Subscription): SubscriptionWithPlan {
  const plan = planById.get(subscription.planId) ?? SUBSCRIPTION_PLANS[0]!;
  const remaining = quotaRemaining(subscription, plan);
  const quotaReached = remaining !== null && remaining <= 0;

  return {
    ...subscription,
    plan,
    quotaRemaining: remaining,
    quotaReached,
    canAcceptBookings: isSubscriptionActive(subscription.status) && !quotaReached,
  };
}

/** How full the current period is, 0–100. Drives the dashboard meter. */
export function quotaPercentage(subscription: SubscriptionWithPlan): number {
  if (subscription.plan.monthlyQuota === null) return 0;
  return Math.min(
    100,
    Math.round((subscription.periodUsage / subscription.plan.monthlyQuota) * 100),
  );
}

const DAY_MS = 86_400_000;

/** Whole days left in the period, counting today. Never below one. */
export function remainingDays(periodEnd: string | Date, now: Date = new Date()): number {
  const end = new Date(periodEnd).getTime();
  return Math.max(1, Math.ceil((end - now.getTime()) / DAY_MS));
}

export function periodDays(periodStart: string | Date, periodEnd: string | Date): number {
  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

/**
 * What a plan change costs today.
 *
 * An upgrade charges only the price difference for the days left in the
 * current period: someone who exhausts their quota mid-month wants to unblock
 * now, and billing them a second full month for the privilege would be a
 * penalty for growing.
 *
 * A downgrade or a move to the free tier costs nothing and takes effect
 * immediately; no refund is issued for the days already paid.
 *
 * A lapsed subscription is not a change but a restart, so it is charged the
 * full monthly price for a fresh period.
 */
export function quoteChange(
  subscription: SubscriptionWithPlan,
  nextPlan: SubscriptionPlan,
  now: Date = new Date(),
): SubscriptionChangeQuote {
  const total = periodDays(subscription.periodStart, subscription.periodEnd);
  const left = remainingDays(subscription.periodEnd, now);

  const base = {
    planId: nextPlan.id,
    planName: nextPlan.name,
    fullAmount: nextPlan.pricePerMonth,
    currency: nextPlan.currency,
    remainingDays: left,
    periodDays: total,
    periodEnd: subscription.periodEnd,
  };

  // A lapsed plan — or one whose month has simply run out — buys a whole new
  // period, not the remainder of one that no longer exists.
  if (!isSubscriptionActive(subscription.status) || isPeriodOver(subscription.periodEnd, now)) {
    return {
      ...base,
      amount: nextPlan.pricePerMonth,
      prorated: false,
      paymentRequired: nextPlan.pricePerMonth > 0,
    };
  }

  const delta = nextPlan.pricePerMonth - subscription.plan.pricePerMonth;
  if (delta <= 0) {
    return { ...base, amount: 0, prorated: false, paymentRequired: false };
  }

  return {
    ...base,
    amount: Math.round((delta * left) / total),
    prorated: true,
    paymentRequired: true,
  };
}

/** True once the paid period has run out, whatever the stored status says. */
export function isPeriodOver(periodEnd: string | Date, now: Date = new Date()): boolean {
  return new Date(periodEnd).getTime() <= now.getTime();
}

export interface PlanAvailability {
  allowed: boolean;
  /** Why the plan cannot be selected right now. */
  reason?: 'current' | 'downgrade_locked';
  /** When a locked plan becomes selectable again. */
  availableFrom?: string;
}

/**
 * Whether a practitioner may move to a given plan today.
 *
 * A period already paid for cannot be traded down mid-flight: someone who
 * bought Pro keeps Pro until the month runs out, so downgrades are refused
 * rather than silently refunded or prorated backwards. Once the period ends —
 * or if the subscription lapsed — every plan is on the table again.
 */
export function planAvailability(
  subscription: SubscriptionWithPlan,
  plan: SubscriptionPlan,
  now: Date = new Date(),
): PlanAvailability {
  if (plan.id === subscription.planId) return { allowed: false, reason: 'current' };

  const inPaidPeriod =
    isSubscriptionActive(subscription.status) && !isPeriodOver(subscription.periodEnd, now);
  if (!inPaidPeriod) return { allowed: true };

  if (plan.pricePerMonth < subscription.plan.pricePerMonth) {
    return {
      allowed: false,
      reason: 'downgrade_locked',
      availableFrom: subscription.periodEnd,
    };
  }
  return { allowed: true };
}

/** Receipt code for a subscription charge: "SUB-2026-00042". */
export function buildInvoiceReference(sequence: number, date: Date = new Date()): string {
  return `SUB-${date.getFullYear()}-${String(sequence).padStart(5, '0')}`;
}

/** Plans a practitioner can move to from their current one, cheapest first. */
export function upgradeOptions(currentPlanId: SubscriptionPlan['id']): SubscriptionPlan[] {
  const current = planById.get(currentPlanId);
  if (!current) return SUBSCRIPTION_PLANS;
  return SUBSCRIPTION_PLANS.filter((plan) => plan.pricePerMonth > current.pricePerMonth);
}
