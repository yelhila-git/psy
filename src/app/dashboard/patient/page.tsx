import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Heart,
  History,
  Landmark,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { appointmentService, patientService, paymentService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { EmptyState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/dashboard/shell';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { AppointmentCard, NextAppointmentCard } from '@/components/dashboard/appointment-card';

export const metadata: Metadata = { title: 'Tableau de bord' };

export default async function PatientDashboardPage() {
  const [patient, stats, next, upcoming, past, favorites, payments, paymentStatuses] =
    await Promise.all([
      patientService.current(),
      patientService.stats(CURRENT_PATIENT_ID),
      appointmentService.next({ patientId: CURRENT_PATIENT_ID }),
      appointmentService.list({ patientId: CURRENT_PATIENT_ID, scope: 'upcoming', limit: 4 }),
      appointmentService.list({ patientId: CURRENT_PATIENT_ID, scope: 'past', limit: 4 }),
      patientService.favorites(CURRENT_PATIENT_ID),
      paymentService.list({ patientId: CURRENT_PATIENT_ID, perPage: 4 }),
      paymentService.statusByAppointment({ patientId: CURRENT_PATIENT_ID }),
    ]);

  const awaitingPayment = upcoming.filter((a) => a.status === 'pending_payment');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <>
      <PageHeader
        title={`${greeting}, ${patient.firstName}`}
        description="Voici où en est votre suivi."
        action={
          <Button asChild>
            <Link href="/psychologists">
              <CalendarPlus />
              Prendre rendez-vous
            </Link>
          </Button>
        }
      />

      {/* An unpaid booking expires on its own, so it outranks everything else. */}
      {awaitingPayment.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning-soft/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-warning-soft text-warning">
                <Landmark className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-secondary">
                  {awaitingPayment.length} rendez-vous en attente de paiement
                </p>
                <p className="mt-0.5 text-base text-muted-foreground">
                  Effectuez le transfert au psychologue avant la fin du délai, sinon le créneau sera
                  libéré.
                </p>
              </div>
            </div>
            <Button className="shrink-0" asChild>
              <Link href={`/payment/${awaitingPayment[0]!.id}`}>
                Voir les instructions de paiement
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {next && (
        <NextAppointmentCard
          appointment={next}
          paymentStatus={paymentStatuses[next.id]}
          viewerRole="patient"
        />
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Rendez-vous à venir"
          value={stats.upcomingCount}
          icon={CalendarCheck}
          tone="primary"
          href="/dashboard/patient/appointments"
        />
        <DashboardCard
          label="Séances effectuées"
          value={stats.completedCount}
          icon={CheckCircle2}
          tone="success"
          hint="depuis votre inscription"
        />
        <DashboardCard
          label="Total dépensé"
          value={formatPrice(stats.totalSpent, stats.currency)}
          icon={Wallet}
          tone="navy"
          href="/dashboard/patient/payments"
        />
        <DashboardCard
          label="Psychologues favoris"
          value={stats.favoriteCount}
          icon={Heart}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Section
            title="Prochains rendez-vous"
            icon={CalendarCheck}
            href="/dashboard/patient/appointments"
          >
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="Aucun rendez-vous prévu"
                description="Trouvez un psychologue et réservez un créneau qui vous convient."
                action={{ label: 'Trouver un psychologue', href: '/psychologists' }}
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    paymentStatus={paymentStatuses[a.id]}
                    viewerRole="patient"
                  />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Consultations passées"
            icon={History}
            href="/dashboard/patient/appointments"
          >
            {past.length === 0 ? (
              <p className="rounded-card border border-dashed border-border-strong bg-surface-alt px-5 py-8 text-center text-base text-muted-foreground">
                Votre historique apparaîtra ici après votre première séance.
              </p>
            ) : (
              <div className="space-y-3">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} viewerRole="patient" />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
              <Heart className="size-4 text-primary" aria-hidden />
              Mes psychologues
            </h2>

            {favorites.length === 0 ? (
              <p className="mt-4 text-base text-muted-foreground">
                Ajoutez un praticien en favori depuis sa fiche pour le retrouver ici.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {favorites.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/psychologists/${p.slug}`}
                      className="flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-muted"
                    >
                      <Avatar src={p.avatarUrl} name={p.fullName} size="sm" square />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-secondary">
                          {p.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.title}
                        </span>
                      </span>
                      <Rating value={p.rating} size="sm" showValue={false} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="outline-muted" full className="mt-4" asChild>
              <Link href="/psychologists">Découvrir d’autres praticiens</Link>
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
              <Wallet className="size-4 text-primary" aria-hidden />
              Derniers paiements
            </h2>

            {payments.data.length === 0 ? (
              <p className="mt-4 text-base text-muted-foreground">Aucun paiement enregistré.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {payments.data.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-secondary">{p.reference}</p>
                      <p className="text-xs text-subtle-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-base font-bold text-secondary">
                        {formatPrice(p.amount, p.currency)}
                      </p>
                      <StatusBadge kind="payment" status={p.status} size="sm" className="mt-0.5" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-primary-soft/50 p-5">
            <Sparkles className="size-6 text-primary" aria-hidden />
            <h2 className="mt-3 text-base font-bold text-secondary">Un conseil</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              La régularité compte davantage que la durée. Une séance hebdomadaire de 45 minutes
              produit généralement de meilleurs résultats qu’une séance mensuelle de deux heures.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ElementType;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Icon className="size-4 text-primary" aria-hidden />
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-base font-medium text-primary hover:underline">
            Tout voir
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
