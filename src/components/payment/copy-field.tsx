'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One line of the practitioner's transfer coordinates.
 *
 * A RIB retyped by hand is a transfer that arrives at the wrong account, so
 * every value the patient has to reproduce is copyable in one click and set
 * in a monospaced face where digits do not blur into each other.
 */
export function CopyField({
  label,
  value,
  copyValue,
  mono,
  emphasis,
  className,
}: {
  label: string;
  value: string;
  /** Copied to the clipboard when it differs from the displayed text. */
  copyValue?: string;
  mono?: boolean;
  emphasis?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the value
      // stays selectable on screen, which is the fallback that always works.
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-control px-3 py-2.5',
        emphasis ? 'bg-primary-soft/50' : 'bg-surface-alt',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-0.5 break-all font-semibold',
            mono && 'font-mono tracking-tight',
            emphasis ? 'text-md text-primary' : 'text-base text-secondary',
          )}
        >
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `${label} copié` : `Copier ${label.toLowerCase()}`}
        className={cn(
          'shrink-0 rounded-control p-2 transition-colors',
          copied
            ? 'text-success'
            : 'text-subtle-foreground hover:bg-background hover:text-primary',
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
