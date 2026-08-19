import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { EMERGENCY_NOTICE, FOOTER_NAV, SITE } from '@/lib/constants';
import { Logo } from './logo';

/**
 * Brand marks are inlined rather than imported: lucide dropped its brand icon
 * set, and these four glyphs are the only ones the product needs.
 */
const SOCIALS: { label: string; href: string; path: string }[] = [
  {
    label: 'Facebook',
    href: '#',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z',
  },
  {
    label: 'Instagram',
    href: '#',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.88a5.96 5.96 0 1 0 0 11.92 5.96 5.96 0 0 0 0-11.92Zm0 9.83a3.87 3.87 0 1 1 0-7.74 3.87 3.87 0 0 1 0 7.74Zm7.59-10.06a1.39 1.39 0 1 1-2.78 0 1.39 1.39 0 0 1 2.78 0Z',
  },
  {
    label: 'YouTube',
    href: '#',
    path: 'M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41c-.86.23-1.54.91-1.77 1.78C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.87.91 1.55 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z',
  },
  {
    label: 'LinkedIn',
    href: '#',
    path: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z',
  },
];

function SocialIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}

/**
 * Navy footer with the teal rule under each column heading, exactly as the
 * Figma lays it out — four columns above a divider, legal line below.
 */
export function Footer() {
  return (
    <footer className="band-navy">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand column */}
          <div>
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-md leading-relaxed text-white/70">{SITE.description}</p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, href, path }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-[4px] bg-accent-soft/80 text-white transition-colors hover:bg-primary"
                >
                  <SocialIcon path={path} className="size-4" />
                </Link>
              ))}
            </div>
          </div>

          {[FOOTER_NAV.company, FOOTER_NAV.support].map((column) => (
            <div key={column.title}>
              <FooterHeading>{column.title}</FooterHeading>
              <ul className="mt-6 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-bold uppercase tracking-wide text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <FooterHeading>Contact</FooterHeading>
            <ul className="mt-6 space-y-3 text-md text-white/75">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
                {SITE.address}
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
                <a href={`mailto:${SITE.email}`} className="hover:text-white">
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
                <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {SITE.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety notice — a mental-health marketplace must state its limits. */}
        <p className="mt-12 rounded-card border border-white/15 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
          {EMERGENCY_NOTICE}
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_NAV.legal.links.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** Column heading with the short teal underline from the Figma footer. */
function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="relative pb-3 text-lg font-bold text-white after:absolute after:bottom-0 after:start-0 after:h-0.5 after:w-8 after:rounded-full after:bg-accent-soft">
      {children}
    </h3>
  );
}
