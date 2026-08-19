import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

/**
 * The six-step onboarding needs the full page width, so this route lives
 * outside the `(auth)` group deliberately: a layout can only add wrapping
 * around its children, never opt out of an ancestor's, so nesting this under
 * `(auth)/layout.tsx` would still render its split shell (form column + navy
 * proof panel) around whatever this layout returns — exactly the squeezed,
 * widget-visible result this route must not have.
 */
export default function PsychologistRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-alt">
      <header className="border-b border-border bg-background">
        <div className="container-page flex h-[72px] items-center justify-between">
          <Logo />
          <Link
            href="/login"
            className="text-base font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            J’ai déjà un compte
          </Link>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}
