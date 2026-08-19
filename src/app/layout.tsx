import type { Metadata, Viewport } from 'next';
import { Heebo, Poppins, Cairo } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import { SITE } from '@/lib/constants';
import { DEFAULT_LOCALE, LOCALE_META } from '@/lib/i18n';
import './globals.css';

/**
 * Heebo is the Figma's primary typeface (358 of 366 text nodes). Poppins
 * carries the UI/navigation labels used on the dashboard screens, and Cairo
 * covers Arabic so the RTL build keeps the same visual weight.
 */
const heebo = Heebo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'psychologue en ligne',
    'téléconsultation',
    'thérapie',
    'santé mentale',
    'Maroc',
    'consultation psychologique',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: 'fr_MA',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#2A939E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={LOCALE_META[DEFAULT_LOCALE].dir}
      className={`${heebo.variable} ${poppins.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans">
        {/* Keyboard users land here first on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu principal
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
