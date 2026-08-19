/**
 * Date-range filtering shared by the admin tables.
 *
 * Bounds travel as "YYYY-MM-DD" strings so the mock services and a future REST
 * backend take the same query shape. They are compared in local time: an admin
 * selecting "1 août" means midnight where they are, not midnight UTC.
 */

export type DateRangePreset = 'all' | '7d' | '30d' | 'month' | 'year' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  /** Only meaningful when preset is 'custom'. */
  from: string;
  to: string;
}

export const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'Toutes les périodes' },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: 'month', label: 'Ce mois-ci' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisée…' },
];

export const ALL_TIME: DateRange = { preset: 'all', from: '', to: '' };

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Turns the UI selection into the inclusive bounds handed to the services. */
export function resolveRange(range: DateRange): { from?: string; to?: string } {
  const now = new Date();
  const today = ymd(now);

  switch (range.preset) {
    case '7d':
      return { from: ymd(daysAgo(6)), to: today };
    case '30d':
      return { from: ymd(daysAgo(29)), to: today };
    case 'month':
      return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case 'year':
      return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: today };
    case 'custom':
      // A half-filled custom range stays open on the missing side.
      return { from: range.from || undefined, to: range.to || undefined };
    default:
      return {};
  }
}

/** Inclusive on both ends; an absent bound means "unbounded on that side". */
export function withinRange(isoDate: string, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const ts = new Date(isoDate).getTime();
  if (from && ts < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && ts > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

/** Human label for the active period, shown beside the recomputed stat tiles. */
export function rangeLabel(range: DateRange): string {
  if (range.preset !== 'custom') {
    return (DATE_PRESETS.find((p) => p.value === range.preset)?.label ?? '').toLowerCase();
  }
  const fmt = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  if (range.from && range.to) return `du ${fmt(range.from)} au ${fmt(range.to)}`;
  if (range.from) return `depuis le ${fmt(range.from)}`;
  if (range.to) return `jusqu’au ${fmt(range.to)}`;
  return 'toutes les périodes';
}
