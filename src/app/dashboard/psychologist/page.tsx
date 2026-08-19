import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  Gift,
  Repeat,
  CalendarClock,
  CalendarRange,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  appointmentService,
  patientService,
  paymentService,
  psychologistService,
  subscriptionService,
} from '@/lib/services';
import { currentPsychologist } from '@/lib/session';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { acceptsBookings } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard, TrendChart } from '@/components/dashboard/dashboard-card';
import { AppointmentCard, NextAppointmentCard } from '@/components/dashboard/appointment-card';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default async function PsychologistDashboardPage() {
  const [
    psychologist,
    stats,
    next,
    today,
    upcoming,
    patients,
    paymentStatuses,
    toConfirm,
    paymentInfo,
    subscription,
  ] = await Promise.all([
      currentPsychologist(),
      psychologistService.stats(CURRENT_PSYCHOLOGIST_ID),
      appointmentService.next({ psychologistId: CURRENT_PSYCHOLOGIST_ID }),
      appointmentService.list({ psychologistId: CURRENT_PSYCHOLOGIST_ID, scope: 'today' }),
      appointmentService.list({
        psychologistId: CURRENT_PSYCHOLOGIST_ID,
        scope: 'upcoming',
        limit: 5,
      }),
      patientService.forPsychologist(CURRENT_PSYCHOLOGIST_ID),
      paymentService.statusByAppointment({ psychologistId: CURRENT_PSYCHOLOGIST_ID }),
      paymentService.pendingConfirmationCount(CURRENT_PSYCHOLOGIST_ID),
      paymentService.paymentInfo(CURRENT_PSYCHOLOGIST_ID),
      subscriptionService.forPsychologist(CURRENT_PSYCHOLOGIST_ID),
    ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <>
      <PageHeader
        title={`${greeting}, ${psychologist?.firstName}`}
        description={`Vous avez ${stats.todayAppointments} consultation${stats.todayAppointments > 1 ? 's' : ''} aujourd’hui.`}
        action={
          <Button variant="outline-muted" asChild>
            <Link href="/dashboard/psychologist/availability">
              <CalendarClock />
              Gérer mes disponibilités
            </Link>
          </Button>
        }
      />

      {/* Money waiting on the practitioner is the most perishable thing on this
          screen — a patient cannot join their session until this is cleared. */}
      {toConfirm > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning-soft/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-warning-soft text-warning">
                <BellRing className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-secondary">
                  {toConfirm} paiement{toConfirm > 1 ? 's nécessitent' : ' nécessite'} votre
                  confirmation
                </p>
                <p className="mt-0.5 text-base text-muted-foreground">
                  Vos patients ne peuvent pas rejoindre la consultation tant que vous n’avez pas
                  confirmé la réception.
                </p>
              </div>
            </div>
            <Button className="shrink-0" asChild>
              <Link href="/dashboard/psychologist/payments">Vérifier les paiements</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* An exhausted quota or a lapsed plan removes the practitioner from
          search entirely, so it outranks every other notice. */}
      {subscription && !subscription.canAcceptBookings && (
        <Card className="mb-6 border-error/40 bg-error-soft/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-error-soft text-error">
                <Repeat className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-secondary">
                  {subscription.quotaReached
                    ? `Quota atteint : ${subscription.periodUsage} consultations ce mois`
                    : 'Votre abonnement n’est plus actif'}
                </p>
                <p className="mt-0.5 text-base text-muted-foreground">
                  Votre profil est retiré des résultats de recherche et aucun patient ne peut
                  réserver. Vos rendez-vous déjà confirmés restent honorés.
                </p>
              </div>
            </div>
            <Button className="shrink-0" asChild>
              <Link href="/dashboard/psychologist/subscription">
                {subscription.quotaReached ? 'Augmenter mon quota' : 'Réactiver mon abonnement'}
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {!acceptsBookings(paymentInfo) && (
        <Card className="mb-6 border-error/40 bg-error-soft/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-error-soft text-error">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-secondary">
                  Aucune coordonnée de paiement active
                </p>
                <p className="mt-0.5 text-base text-muted-foreground">
                  Les patients ne peuvent pas réserver avec vous tant qu’ils ne savent pas où
                  virer les honoraires.
                </p>
              </div>
            </div>
            <Button className="shrink-0" asChild>
              <Link href="/dashboard/psychologist/payment-info">Renseigner mes coordonnées</Link>
            </Button>
          </div>
        </Card>
      )}

      {next && (
        <NextAppointmentCard
          appointment={next}
          paymentStatus={paymentStatuses[next.id]}
          viewerRole="psychologist"
        />
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Consultations aujourd’hui"
          value={stats.todayAppointments}
          icon={CalendarCheck}
          tone="primary"
          href="/dashboard/psychologist/appointments"
        />
        <DashboardCard
          label="Cette semaine"
          value={stats.weekAppointments}
          icon={CalendarRange}
          tone="navy"
          href="/dashboard/psychologist/calendar"
        />
        <DashboardCard
          label="Patients suivis"
          value={stats.totalPatients}
          icon={Users}
          tone="success"
          href="/dashboard/psychologist/patients"
        />
        <DashboardCard
          label="Premières consultations offertes"
          value={stats.freeConsultations}
          icon={Gift}
          tone="warning"
          hint="ce mois-ci"
        />
        <DashboardCard
          label="Consultations payantes"
          value={stats.paidConsultations}
          icon={CalendarCheck}
          tone="navy"
          hint="ce mois-ci"
        />
        <DashboardCard
          label="Revenus du mois"
          value={formatPrice(stats.monthEarnings, stats.currency)}
          icon={Wallet}
          tone="success"
          hint="sans commission"
          href="/dashboard/psychologist/earnings"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
                <CalendarCheck className="size-4 text-primary" aria-hidden />
                Aujourd’hui
              </h2>
              <Link
                href="/dashboard/psychologist/appointments"
                className="text-base font-medium text-primary hover:underline"
              >
                Tout voir
              </Link>
            </div>

            {today.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Aucune consultation aujourd’hui"
                description="Profitez-en, ou ouvrez de nouveaux créneaux pour la semaine."
                action={{
                  label: 'Gérer mes disponibilités',
                  href: '/dashboard/psychologist/availability',
                }}
              />
            ) : (
              <div className="space-y-3">
                {today.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    paymentStatus={paymentStatuses[a.id]}
                    viewerRole="psychologist"
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-md font-bold text-secondary">
              <CalendarRange className="size-4 text-primary" aria-hidden />
              Prochains rendez-vous
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-card border border-dashed border-border-strong bg-surface-alt px-5 py-8 text-center text-base text-muted-foreground">
                Aucune consultation programmée pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    paymentStatus={paymentStatuses[a.id]}
                    viewerRole="psychologist"
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Profile completion drives quality of listings, so it leads the rail. */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
              <UserCheck className="size-4 text-primary" aria-hidden />
              Complétion du profil
            </h2>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-secondary">
                {psychologist?.profileCompletion ?? 0}%
              </span>
              <span className="text-xs text-muted-foreground">
                {(psychologist?.profileCompletion ?? 0) >= 90 ? 'Excellent' : 'À compléter'}
              </span>
            </div>
            <Progress value={psychologist?.profileCompletion ?? 0} className="mt-2" />

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Les profils complets reçoivent en moyenne trois fois plus de demandes. Ajoutez une
              présentation vidéo et détaillez vos approches pour aller plus loin.
            </p>

            <Button variant="outline-muted" full className="mt-4" asChild>
              <Link href="/dashboard/psychologist/profile">Compléter mon profil</Link>
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
              <TrendingUp className="size-4 text-primary" aria-hidden />
              Revenus sur 6 mois
            </h2>
            <TrendChart
              className="mt-5"
              data={stats.earningsTrend.map((point) => ({
                label: point.month,
                value: point.amount,
              }))}
              format={(value) => formatPrice(value)}
            />
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Taux de réalisation</p>
                <p className="text-md font-bold text-secondary">{stats.completionRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
                <p className="flex items-center gap-1.5 text-md font-bold text-secondary">
                  <Star className="size-4 fill-amber text-amber" aria-hidden />
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
                <Users className="size-4 text-primary" aria-hidden />
                Patients récents
              </h2>
              <Link
                href="/dashboard/psychologist/patients"
                className="text-base font-medium text-primary hover:underline"
              >
                Tout voir
              </Link>
            </div>

            {patients.length === 0 ? (
              <p className="mt-4 text-base text-muted-foreground">Aucun patient pour l’instant.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {patients.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <Avatar src={p.avatarUrl} name={p.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-secondary">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.sessionCount} séance{p.sessionCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
