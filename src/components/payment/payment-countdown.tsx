'use client';

import * as React from 'react';
import { Clock, TimerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown } from '@/lib/payments';

/**
 * Live countdown on the patient's payment window.
 *
 * Rendered client-side only after mount: the server and the browser would
 * otherwise disagree on "now" and React would flag the mismatch.
 */
export function PaymentCountdown({
  expiresAt,
  onExpire,
  className,
}: {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}) {
  const deadline = React.useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  // Fires once the clock actually reaches zero, not on every subsequent tick.
  const expired = remaining !== null && remaining <= 0;
  const notified = React.useRef(false);
  React.useEffect(() => {
    if (expired && !notified.current) {
      notified.current = true;
      onExpire?.();
    }
  }, [expired, onExpire]);

  if (remaining === null) {
    return (
      <p className={cn('flex items-center gap-2 text-base text-muted-foreground', className)}>
        <Clock className="size-4 shrink-0 text-primary" aria-hidden />
        Calcul du délai restant…
      </p>
    );
  }

  if (expired) {
    return (
      <p className={cn('flex items-center gap-2 text-base font-semibold text-error', className)}>
        <TimerOff className="size-4 shrink-0" aria-hidden />
        Le délai de paiement est écoulé.
      </p>
    );
  }

  const urgent = remaining < 5 * 60_000;

  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-base',
        urgent ? 'text-error' : 'text-muted-foreground',
        className,
      )}
      // Minute-level updates only: a per-second live region would flood
      // screen readers with a number they cannot act on.
      aria-live="off"
    >
      <Clock className={cn('size-4 shrink-0', urgent ? 'text-error' : 'text-primary')} aria-hidden />
      Veuillez effectuer le paiement dans les
      <strong className={cn('font-bold tabular-nums', urgent ? 'text-error' : 'text-secondary')}>
        {formatCountdown(remaining)}
      </strong>
      restantes.
    </p>
  );
}
