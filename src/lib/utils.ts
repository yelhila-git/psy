import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money is stored in minor units (centimes) everywhere to avoid float drift. */
export function formatPrice(
  amountInCentimes: number,
  currency: string = 'MAD',
  locale: string = 'fr-MA',
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountInCentimes / 100);
}

export function formatDate(date: string | Date, locale: string = 'fr-FR') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date, locale: string = 'fr-FR') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d);
}

export function formatTime(date: string | Date, locale: string = 'fr-FR') {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);
}

/** "il y a 3 jours" / "dans 2 heures" — used in messages and activity feeds. */
export function formatRelative(date: string | Date, locale: string = 'fr') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(Math.round(diff / 1000), 'second');
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Strips accents (é -> e) so "Sofía Benali" slugs cleanly. */
const COMBINING_MARKS = /[̀-ͯ]/g;

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Simulates network latency so loading states are exercised during development. */
export function delay(ms: number = 320) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Builds the page list for the marketplace paginator: 1 … 4 5 6 … 12 */
export function paginationRange(current: number, total: number, siblings = 1): (number | '…')[] {
  const totalNumbers = siblings * 2 + 5;
  if (total <= totalNumbers) return range(1, total);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  if (!showLeftDots && showRightDots) return [...range(1, 3 + siblings * 2), '…', total];
  if (showLeftDots && !showRightDots) return [1, '…', ...range(total - (2 + siblings * 2), total)];
  return [1, '…', ...range(left, right), '…', total];
}
