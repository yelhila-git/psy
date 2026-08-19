import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-alt px-5 text-center">
      <Logo />

      <p className="mt-10 text-7xl font-black text-primary-soft">404</p>
      <h1 className="mt-4 text-3xl font-bold text-secondary">Cette page n’existe pas</h1>
      <p className="mt-3 max-w-md text-md leading-relaxed text-muted-foreground">
        Le lien est peut-être obsolète, ou la page a été déplacée. Reprenez depuis l’accueil ou
        cherchez directement un psychologue.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/">
            <Home />
            Retour à l’accueil
          </Link>
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/psychologists">
            <Search />
            Trouver un psychologue
          </Link>
        </Button>
      </div>
    </div>
  );
}
