import Link from 'next/link';
import { ChevronLeft, Lock, ShieldCheck, Star } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

const PROOF = [
  { icon: ShieldCheck, text: 'Psychologues diplômés et vérifiés un par un' },
  { icon: Lock, text: 'Séances chiffrées, jamais enregistrées' },
  { icon: Star, text: '4,8/5 sur plus de 2 400 consultations' },
];

/**
 * Split auth shell: the form on the left, a navy reassurance panel on the
 * right. On mobile the panel is dropped entirely rather than stacked — it
 * would push the form below the fold for no benefit.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-4 rtl-flip" />
            Accueil
          </Link>
        </div>

        <main id="main" className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden band-navy lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pattern-puzzle absolute inset-0" aria-hidden />

        <div className="relative max-w-md">
          <p className="eyebrow text-accent-soft">AlloMonPsy</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
            Parler à quelqu’un ne devrait jamais être compliqué
          </h2>
          <p className="mt-5 text-md leading-relaxed text-white/70">
            Des praticiens vérifiés, des créneaux qui s’adaptent à votre emploi du temps, et un
            cadre strictement confidentiel — depuis chez vous.
          </p>

          <ul className="mt-10 space-y-4">
            {PROOF.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-base text-white/85">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="size-4 text-accent-soft" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
