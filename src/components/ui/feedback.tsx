import * as React from 'react';
import Link from 'next/link';
import { cn, paginationRange } from '@/lib/utils';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Shimmer placeholder. Always mirror the real element's dimensions. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-control bg-muted', className)}
      aria-hidden
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/**
 * Empty state. `title` explains what's missing, `description` says why, and the
 * action gives a way out — an empty screen without a next step is a dead end.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface-alt px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-7" aria-hidden />
        </span>
      )}
      <h3 className="text-md font-bold text-secondary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button variant="outline-muted" asChild>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline-muted" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}

/** Marketplace paginator. Renders nothing for a single page. */
export function Pagination({
  page,
  lastPage,
  onPageChange,
  className,
}: {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (lastPage <= 1) return null;
  const pages = paginationRange(page, lastPage);

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <Button
        variant="outline-muted"
        size="icon-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="rtl-flip" />
      </Button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-subtle-foreground" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'size-9 rounded-control text-base font-medium transition-colors',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:border-primary hover:text-primary',
            )}
          >
            {p}
          </button>
        ),
      )}

      <Button
        variant="outline-muted"
        size="icon-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= lastPage}
        aria-label="Page suivante"
      >
        <ChevronRight className="rtl-flip" />
      </Button>
    </nav>
  );
}

/** Section heading with the Figma eyebrow + navy title + optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  onDark,
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'start' | 'center';
  onDark?: boolean;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        action && 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('eyebrow mb-3', onDark && 'text-accent-soft')}>{eyebrow}</p>
        )}
        <h2
          className={cn(
            'text-3xl font-bold leading-[1.15] sm:text-4xl',
            onDark ? 'text-white' : 'text-secondary',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-4 text-md leading-relaxed',
              onDark ? 'text-white/75' : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
