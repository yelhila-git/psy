/**
 * Lightweight locale + direction registry.
 *
 * The platform ships French first (Morocco), with Arabic and English to follow.
 * Direction is derived here so every layout can mirror correctly via `dir`,
 * and components can stay direction-agnostic by using logical Tailwind
 * utilities (ms-/me-/ps-/pe-, provided by tailwindcss-rtl).
 */

export const LOCALES = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; dir: 'ltr' | 'rtl'; intl: string; flag: string }
> = {
  fr: { label: 'French', nativeLabel: 'Français', dir: 'ltr', intl: 'fr-MA', flag: '🇫🇷' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', intl: 'ar-MA', flag: '🇲🇦' },
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', intl: 'en-US', flag: '🇬🇧' },
};

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return LOCALE_META[locale].dir;
}

export function isRTL(locale: Locale) {
  return getDirection(locale) === 'rtl';
}

export function intlLocale(locale: Locale) {
  return LOCALE_META[locale].intl;
}
