'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'size-3.5', default: 'size-4', lg: 'size-5' } as const;

export function Rating({
  value,
  count,
  size = 'default',
  showValue = true,
  className,
}: {
  value: number;
  count?: number;
  size?: keyof typeof SIZES;
  showValue?: boolean;
  className?: string;
}) {
  // A single clipped overlay renders half-stars correctly at any ratio,
  // which a per-star rounding approach cannot.
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="relative inline-flex"
        role="img"
        aria-label={`${value.toFixed(1)} sur 5${count !== undefined ? `, ${count} avis` : ''}`}
      >
        <span className="flex gap-0.5 text-border-strong">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={SIZES[size]} fill="currentColor" strokeWidth={0} aria-hidden />
          ))}
        </span>
        <span
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber"
          style={{ width: `${percent}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn(SIZES[size], 'shrink-0')} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
      </span>

      {showValue && (
        <span className="text-base font-bold leading-none text-secondary">{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs leading-none text-subtle-foreground">({count})</span>
      )}
    </div>
  );
}

/** Interactive variant used in the post-consultation review form. */
export function RatingInput({
  value,
  onChange,
  size = 'lg',
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [hover, setHover] = React.useState(0);
  const active = hover || value;

  return (
    <div className={cn('flex items-center gap-1', className)} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          aria-pressed={value === star}
        >
          <Star
            className={cn(SIZES[size], star <= active ? 'text-amber' : 'text-border-strong')}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}
