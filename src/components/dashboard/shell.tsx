'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Menu, Search } from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './sidebar';

export interface ShellUser {
  fullName: string;
  avatarUrl: string;
  subtitle: string;
  verified?: boolean;
}

/** Fixed sidebar + sticky topbar. The sidebar collapses to a drawer below lg. */
export function DashboardShell({
  role,
  user,
  badges,
  children,
}: {
  role: UserRole;
  user: ShellUser;
  /** Sidebar counters keyed by href. */
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const profileHref =
    role === 'admin' ? '/admin/settings' : `/dashboard/${role}/profile`;
  const settingsHref =
    role === 'admin' ? '/admin/settings' : `/dashboard/${role}/settings`;

  return (
    <div className="min-h-dvh bg-surface-alt">
      <Sidebar
        role={role}
        user={user}
        badges={badges}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="print:ps-0 lg:ps-[280px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-border bg-background/95 px-5 backdrop-blur print:hidden lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-control p-2 text-secondary lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden max-w-sm flex-1 md:block">
            <Input
              placeholder="Rechercher…"
              startAdornment={<Search />}
              className="h-10 bg-muted/60"
              aria-label="Recherche"
            />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-control p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute end-2 top-2 size-2 rounded-full bg-error ring-2 ring-background" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2.5 rounded-control p-1 transition-colors hover:bg-muted"
                aria-label="Menu du compte"
              >
                <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
                <span className="hidden text-start sm:block">
                  <span className="block text-base font-semibold leading-tight text-secondary">
                    {user.fullName}
                  </span>
                  <span className="block text-2xs text-muted-foreground">{user.subtitle}</span>
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>Mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={settingsHref}>Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive asChild>
                  <Link href="/">Se déconnecter</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" className="p-5 print:p-0 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page title block used at the top of every dashboard screen. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold text-secondary">{title}</h1>
        {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
