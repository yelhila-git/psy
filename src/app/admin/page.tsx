import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  ClipboardCheck,
  Gift,
  Repeat,
  Stethoscope,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { adminService } from '@/lib/services';
import { formatDate, formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard, TrendChart } from '@/components/dashboard/dashboard-card';

export const metadata: Metadata = { title: 'Administration' };

export default async function AdminDashboardPage() {
  const [stats, pending, subscriptions] = await Promise.all([
    adminService.stats(),
    adminService.psychologists({ status: 'pending', perPage: 5 }),
    adminService.subscriptions({ perPage: 5 }),
  ]);

  return (
    <>
      <PageHeader
        title="Vue d’ensemble"
        description="Activité de la plateforme et file de modération."
        action={
          <Button asChild>
            <Link href="/admin/psychologists">
              <ClipboardCheck />
              File de vérification
              {stats.pendingVerifications > 0 && ` (${stats.pendingVerifications})`}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard
          label="Psychologues"
          value={stats.psychologists}
          icon={Stethoscope}
          tone="primary"
          href="/admin/psychologists"
        />
        <DashboardCard
          label="Vérifications en attente"
          value={stats.pendingVerifications}
          icon={ClipboardCheck}
          tone={stats.pendingVerifications > 0 ? 'warning' : 'success'}
          hint={stats.pendingVerifications > 0 ? 'à traiter' : 'file vide'}
          href="/admin/psychologists"
        />
        <DashboardCard
          label="Patients inscrits"
          value={stats.patients}
          icon={Users}
          tone="navy"
          href="/admin/patients"
        />
        <DashboardCard
          label="Consultations"
          value={stats.appointments}
          icon={CalendarDays}
          tone="primary"
          href="/admin/appointments"
        />
        <DashboardCard
          label="Revenus d’abonnement"
          value={formatPrice(stats.subscriptionRevenue, stats.currency)}
          icon={Repeat}
          tone="success"
          hint="mensuel récurrent"
          href="/admin/subscriptions"
        />
        <DashboardCard
          label="Psychologues actifs"
          value={stats.activePsychologists}
          icon={Stethoscope}
          tone="primary"
          hint="abonnement en cours"
          href="/admin/subscriptions"
        />
        <DashboardCard
          label="Premières consultations offertes"
          value={stats.freeConsultations}
          icon={Gift}
          tone="warning"
          hint="acquisition patient"
          href="/admin/appointments"
        />
        <DashboardCard
          label="Consultations payantes"
          value={stats.paidConsultations}
          icon={Wallet}
          tone="navy"
          hint={`${formatPrice(stats.practitionerVolume)} versés aux praticiens`}
          href="/admin/payments"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <TrendingUp className="size-4 text-primary" aria-hidden />
            Volume de consultations sur 6 mois
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Honoraires versés directement aux praticiens. La plateforme n’en perçoit rien.
          </p>

          <TrendChart
            className="mt-6"
            data={stats.revenueTrend.map((point) => ({
              label: point.month,
              value: point.consultations,
            }))}
            format={(value) => formatPrice(value)}
          />

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Volume praticiens</p>
              <p className="text-md font-bold text-secondary">
                {formatPrice(stats.practitionerVolume, stats.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenus plateforme</p>
              <p className="text-md font-bold text-success">
                {formatPrice(stats.subscriptionRevenue, stats.currency)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
              <ClipboardCheck className="size-4 text-primary" aria-hidden />
              À vérifier
            </h2>
            <Link
              href="/admin/psychologists"
              className="text-base font-medium text-primary hover:underline"
            >
              Tout voir
            </Link>
          </div>

          {pending.data.length === 0 ? (
            <p className="mt-6 rounded-card bg-success-soft px-4 py-6 text-center text-base text-muted-foreground">
              Aucune vérification en attente. La file est à jour.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {pending.data.map((psy) => (
                <li key={psy.id} className="flex items-center gap-3 py-3.5">
                  <Avatar src={psy.avatarUrl} name={psy.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-secondary">{psy.fullName}</p>
                    <p className="truncate text-xs text-subtle-foreground">
                      {psy.submittedAt ? `Soumis le ${formatDate(psy.submittedAt)}` : psy.title}
                    </p>
                  </div>
                  <StatusBadge kind="verification" status={psy.verificationStatus} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <Repeat className="size-4 text-primary" aria-hidden />
            Abonnements les plus contributifs
          </h2>
          <Link
            href="/admin/subscriptions"
            className="text-base font-medium text-primary hover:underline"
          >
            Tout voir
          </Link>
        </div>

        <ul className="mt-5 divide-y divide-border">
          {subscriptions.data.map((row, i) => (
            <li key={row.psychologistId} className="flex items-center gap-4 py-3.5">
              <span className="w-5 shrink-0 text-base font-bold text-subtle-foreground">
                {i + 1}
              </span>
              <Avatar src={row.avatarUrl} name={row.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-secondary">{row.fullName}</p>
                <p className="text-xs text-subtle-foreground">
                  Formule {row.planName} · {row.periodUsage}
                  {row.monthlyQuota === null ? ' consultations' : ` / ${row.monthlyQuota}`} ce mois
                </p>
              </div>
              <p className="shrink-0 text-base font-bold text-secondary">
                {row.pricePerMonth === 0 ? 'Gratuit' : `${formatPrice(row.pricePerMonth)} / mois`}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
