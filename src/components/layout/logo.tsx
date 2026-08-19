import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The Figma wordmark: a speech-bubble mark followed by "Allo" in the light
 * tone and "monpsy" in the heavy tone. On the navy footer the whole lockup
 * inverts to white, which `tone="light"` handles.
 */
export function Logo({
  className,
  tone = 'dark',
  href = '/',
  showText = true,
}: {
  className?: string;
  tone?: 'dark' | 'light';
  href?: string | null;
  showText?: boolean;
}) {
  const mark = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 34 34"
        className="size-8 shrink-0"
        role="img"
        aria-label="AlloMonPsy"
        fill="none"
      >
        {/* Speech bubble — the conversation at the centre of the product. */}
        <path
          d="M17 2.5c8.008 0 14.5 5.82 14.5 13 0 7.18-6.492 13-14.5 13a16.6 16.6 0 0 1-4.36-.575L5.2 30.9a.9.9 0 0 1-1.24-1.02l1.29-5.42C3.16 22.16 2.5 18.74 2.5 15.5c0-7.18 6.492-13 14.5-13Z"
          fill={tone === 'light' ? '#ffffff' : 'hsl(var(--secondary))'}
        />
        {/* The teal counterform, echoing the mark in the Figma header. */}
        <circle cx="11.5" cy="14.5" r="4" fill={tone === 'light' ? 'hsl(var(--primary))' : '#ffffff'} />
        <path
          d="M19 11.2c2.9 0 5.2 1.9 5.2 4.3 0 2.4-2.3 4.3-5.2 4.3-.7 0-1.3-.1-1.9-.3l-2.6 1.2.7-2.4c-.9-.8-1.4-1.8-1.4-2.8 0-2.4 2.3-4.3 5.2-4.3Z"
          fill="hsl(var(--primary))"
        />
      </svg>

      {showText && (
        <span className="text-lg font-black leading-none tracking-tight">
          <span className="text-primary">Allo</span>
          <span className={tone === 'light' ? 'text-white' : 'text-secondary'}>monpsy</span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="rounded-control focus-visible:ring-2 focus-visible:ring-ring">
      {mark}
      <span className="sr-only">AlloMonPsy — accueil</span>
    </Link>
  );
}
