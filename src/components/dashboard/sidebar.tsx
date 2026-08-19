'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  CalendarRange,
  CreditCard,
  FileText,
  Heart,
  Landmark,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MessageSquare,
  Repeat,
  Settings,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const PATIENT_NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/patient', icon: LayoutDashboard },
  { label: 'Rendez-vous', href: '/dashboard/patient/appointments', icon: CalendarDays },
  { label: 'Messages', href: '/dashboard/patient/messages', icon: MessageSquare },
  { label: 'Psychologues', href: '/psychologists', icon: Stethoscope },
  { label: 'Paiements', href: '/dashboard/patient/payments', icon: CreditCard },
  { label: 'Mon profil', href: '/dashboard/patient/profile', icon: User },
  { label: 'Paramètres', href: '/dashboard/patient/settings', icon: Settings },
];

export const PSYCHOLOGIST_NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard/psychologist', icon: LayoutDashboard },
  { label: 'Rendez-vous', href: '/dashboard/psychologist/appointments', icon: CalendarDays },
  { label: 'Agenda', href: '/dashboard/psychologist/calendar', icon: CalendarRange },
  { label: 'Patients', href: '/dashboard/psychologist/patients', icon: Users },
  { label: 'Messages', href: '/dashboard/psychologist/messages', icon: MessageSquare },
  { label: 'Disponibilités', href: '/dashboard/psychologist/availability', icon: CalendarRange },
  { label: 'Paiements à confirmer', href: '/dashboard/psychologist/payments', icon: Landmark },
  { label: 'Mes informations de paiement', href: '/dashboard/psychologist/payment-info', icon: CreditCard },
  { label: 'Revenus', href: '/dashboard/psychologist/earnings', icon: Wallet },
  { label: 'Factures', href: '/dashboard/psychologist/invoices', icon: FileText },
  { label: 'Mon abonnement', href: '/dashboard/psychologist/subscription', icon: Repeat },
  { label: 'Mon profil', href: '/dashboard/psychologist/profile', icon: User },
  { label: 'Paramètres', href: '/dashboard/psychologist/settings', icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Vue d’ensemble', href: '/admin', icon: LayoutDashboard },
  { label: 'Psychologues', href: '/admin/psychologists', icon: Stethoscope },
  { label: 'Patients', href: '/admin/patients', icon: Users },
  { label: 'Rendez-vous', href: '/admin/appointments', icon: CalendarDays },
  { label: 'Paiements', href: '/admin/payments', icon: CreditCard },
  { label: 'Abonnements', href: '/admin/subscriptions', icon: Repeat },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export function navForRole(role: UserRole) {
  return role === 'patient' ? PATIENT_NAV : role === 'psychologist' ? PSYCHOLOGIST_NAV : ADMIN_NAV;
}

export function Sidebar({
  role,
  user,
  badges,
  open,
  onClose,
}: {
  role: UserRole;
  user: { fullName: string; avatarUrl: string; subtitle: string; verified?: boolean };
  /** Live counters keyed by href — the payments queue, for instance. */
  badges?: Record<string, number>;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = navForRole(role).map((item) =>
    badges?.[item.href] ? { ...item, badge: badges[item.href] } : item,
  );

  // Exact match for index routes, prefix match for the rest — otherwise
  // "/dashboard/patient" would stay highlighted on every child page.
  const isActive = (href: string) => {
    const isIndex = href.split('/').length <= 3;
    return isIndex ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-secondary/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 flex w-[280px] flex-col border-e border-border bg-card transition-transform duration-200 print:hidden lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0',
          open ? 'translate-x-0 rtl:translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navigation du tableau de bord"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-1.5 text-muted-foreground lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Identity block */}
        <div className="shrink-0 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={user.fullName} size="default" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-base font-bold text-secondary">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.subtitle}</p>
            </div>
          </div>
          {role === 'psychologist' && (
            <Badge variant={user.verified ? 'success' : 'warning'} size="sm" className="mt-3">
              <ShieldCheck aria-hidden />
              {user.verified ? 'Profil vérifié' : 'Vérification en cours'}
            </Badge>
          )}
          {role === 'admin' && (
            <Badge variant="navy" size="sm" className="mt-3">
              Administrateur
            </Badge>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-control px-4 py-2.5 font-ui text-base transition-colors',
                      active
                        ? 'bg-primary-soft/60 font-semibold text-secondary before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-secondary',
                    )}
                  >
                    <item.icon
                      className={cn('size-[18px] shrink-0', active && 'text-primary')}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <Badge variant="solid" size="sm">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          {role === 'patient' && (
            <Link
              href="/psychologists"
              className="mb-2 flex items-center gap-3 rounded-control bg-secondary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-secondary-hover"
            >
              <Heart className="size-4" aria-hidden />
              Prendre un rendez-vous
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-control px-4 py-2.5 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-error"
          >
            <LogOut className="size-[18px] rtl-flip" aria-hidden />
            Se déconnecter
          </Link>
        </div>
      </aside>
    </>
  );
}
