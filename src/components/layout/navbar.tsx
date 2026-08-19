'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAIN_NAV } from '@/lib/constants';
import { LOCALE_META, LOCALES, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Public header. Matches the Figma: white bar, centred nav in bold navy,
 * outlined "Connexion" next to a filled teal "Prise de RDV".
 *
 * It gains a shadow once the page scrolls so it separates from hero imagery
 * without needing a permanent border.
 */
export function Navbar({ locale = 'fr' }: { locale?: Locale }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => setOpen(false), [pathname]);

  // Prevent background scroll while the drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-background transition-shadow duration-200',
        scrolled ? 'shadow-header' : 'border-b border-transparent',
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6 lg:h-[91px]">
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navigation principale">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative text-sm font-bold uppercase tracking-wide transition-colors',
                isActive(item.href) ? 'text-primary' : 'text-secondary hover:text-primary',
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-1.5 start-0 h-0.5 w-full rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher locale={locale} className="hidden md:flex" />

          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/psychologists">Prise de RDV</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-control p-2 text-secondary lg:hidden"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — a designed panel, not a squeezed desktop nav. */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-border bg-background lg:hidden">
          <nav className="container-page flex flex-col py-6" aria-label="Navigation mobile">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'border-b border-border py-4 text-md font-semibold transition-colors',
                  isActive(item.href) ? 'text-primary' : 'text-secondary',
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/register/psychologist"
              className="border-b border-border py-4 text-md font-semibold text-secondary"
            >
              Je suis psychologue
            </Link>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="outline" size="lg" full asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button size="lg" full asChild>
                <Link href="/psychologists">Trouver un psychologue</Link>
              </Button>
            </div>

            <LocaleSwitcher locale={locale} className="mt-6 self-start" />
          </nav>
        </div>
      )}
    </header>
  );
}

export function LocaleSwitcher({
  locale,
  className,
  tone = 'dark',
}: {
  locale: Locale;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  // Locale is presentational for now; wiring it to next-intl routing is a
  // drop-in change once translation files exist.
  const [current, setCurrent] = React.useState<Locale>(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-medium transition-colors',
          tone === 'light'
            ? 'text-white/80 hover:text-white'
            : 'text-muted-foreground hover:text-primary',
          className,
        )}
        aria-label="Changer de langue"
      >
        <Globe className="size-4" />
        <span className="uppercase">{current}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => {
              setCurrent(code);
              // Arabic flips the whole document; components use logical
              // properties so no per-component work is needed.
              document.documentElement.lang = code;
              document.documentElement.dir = LOCALE_META[code].dir;
            }}
            className={cn(current === code && 'font-semibold text-primary')}
          >
            <span className="me-2">{LOCALE_META[code].flag}</span>
            {LOCALE_META[code].nativeLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
