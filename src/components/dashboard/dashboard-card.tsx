import Link from 'next/link';
import { ArrowUpRight, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

/** KPI tile. `tone` colours the icon chip only — the number stays high-contrast. */
export function DashboardCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  trend,
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'navy' | 'error';
  trend?: { value: number; label?: string };
  href?: string;
  className?: string;
}) {
  const TONES = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    navy: 'bg-secondary-soft text-secondary',
    error: 'bg-error-soft text-error',
  } as const;

  const body = (
    <Card
      interactive={Boolean(href)}
      className={cn('flex h-full flex-col justify-between p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex size-11 items-center justify-center rounded-card', TONES[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        {href && <ArrowUpRight className="size-4 text-subtle-foreground" aria-hidden />}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold leading-tight text-secondary">{value}</p>
        <p className="mt-0.5 text-base text-muted-foreground">{label}</p>
      </div>

      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                trend.value >= 0 ? 'text-success' : 'text-error',
              )}
            >
              {trend.value >= 0 ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {hint && <span className="text-subtle-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full rounded-card focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Compact bar chart for revenue / earnings trends — no charting dependency. */
export function TrendChart({
  data,
  format,
  className,
}: {
  data: { label: string; value: number }[];
  format: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('flex items-end gap-3', className)}>
      {data.map((point) => (
        <div key={point.label} className="group flex flex-1 flex-col items-center gap-2">
          <span className="text-2xs font-medium text-subtle-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {format(point.value)}
          </span>
          <div
            className="w-full rounded-t-[4px] bg-primary/80 transition-colors group-hover:bg-primary"
            style={{ height: `${Math.max(4, (point.value / max) * 120)}px` }}
            role="img"
            aria-label={`${point.label} : ${format(point.value)}`}
          />
          <span className="text-2xs capitalize text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
