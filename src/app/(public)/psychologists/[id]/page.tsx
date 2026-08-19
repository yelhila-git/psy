import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Clock,
  Gift,
  GraduationCap,
  Globe2,
  MessageSquare,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import {
  appointmentService,
  paymentService,
  psychologistService,
  subscriptionService,
} from '@/lib/services';
import { psychologists } from '@/lib/mock/psychologists';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { APPROACHES, LANGUAGES, SPECIALTIES } from '@/lib/constants';
import { acceptsBookings } from '@/lib/payments';
import { formatPrice } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge, VerifiedBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import { Separator } from '@/components/ui/misc';
import { BookingPanel } from '@/components/booking/booking-calendar';
import { ReviewCard, ReviewSummary } from '@/components/psychologists/review-card';

const label = (list: readonly { value: string; label: string }[], value: string) =>
  list.find((item) => item.value === value)?.label ?? value;

export async function generateStaticParams() {
  return psychologists.filter((p) => p.isVerified).map((p) => ({ id: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const psychologist = await psychologistService.getById(id);
  if (!psychologist) return { title: 'Profil introuvable' };

  return {
    title: `${psychologist.fullName} — ${psychologist.title}`,
    description: psychologist.headline,
  };
}

export default async function PsychologistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const psychologist = await psychologistService.getById(id);
  if (!psychologist) notFound();

  const [reviews, paymentInfo, subscriptionOk, isFirstConsultation] = await Promise.all([
    psychologistService.reviews(psychologist.id),
    paymentService.paymentInfo(psychologist.id),
    subscriptionService.canAcceptBookings(psychologist.id),
    appointmentService.isFirstConsultation(CURRENT_PATIENT_ID, psychologist.id),
  ]);

  // Two independent gates: a practitioner needs somewhere to be paid, and a
  // live subscription with quota left. Either one closes the door.
  const bookable = acceptsBookings(paymentInfo) && subscriptionOk;

  return (
    <>
      {/* --- Navy banner with the puzzle texture from the Figma ------------ */}
      <section className="relative band-navy">
        <div className="pattern-puzzle absolute inset-0" aria-hidden />
        <div className="container-page relative h-[180px] sm:h-[220px]" />
      </section>

      <div className="container-page">
        {/* --- Overlapping identity card ---------------------------------- */}
        <Card flat className="relative -mt-24 p-6 sm:-mt-28 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <Avatar
              src={psychologist.avatarUrl}
              name={psychologist.fullName}
              size="3xl"
              square
              ring
              className="shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-secondary sm:text-3xl">
                  {psychologist.fullName}
                </h1>
                {psychologist.isVerified && <VerifiedBadge />}
              </div>

              <p className="mt-1 text-md text-muted-foreground">{psychologist.title}</p>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {psychologist.headline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Rating value={psychologist.rating} count={psychologist.reviewCount} />
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <Clock className="size-4 text-primary" aria-hidden />
                  {psychologist.yearsOfExperience} ans d’expérience
                </span>
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <Globe2 className="size-4 text-primary" aria-hidden />
                  {psychologist.languages.map((l) => label(LANGUAGES, l)).join(', ')}
                </span>
                <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <Users className="size-4 text-primary" aria-hidden />
                  {psychologist.patientCount} patients suivis
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {psychologist.specialties.map((s) => (
                  <Badge key={s} size="lg">
                    <VerifiedBadge showLabel={false} size="sm" />
                    {label(SPECIALTIES, s)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:w-52">
              {/* The free first session is the strongest reason to book, so it
                  leads the price block rather than sitting beneath it. */}
              {isFirstConsultation ? (
                <div className="rounded-card bg-success-soft p-4 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide text-success">
                    <Gift className="size-3.5" aria-hidden />
                    Première consultation
                  </p>
                  <p className="mt-1 text-xl font-bold text-success">Gratuite</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    puis {formatPrice(psychologist.pricePerHour, psychologist.currency)} la séance
                    de 60 min
                  </p>
                </div>
              ) : (
                <div className="rounded-card bg-surface-alt p-4 text-center">
                  <p className="text-xs text-muted-foreground">Séance de 60 min</p>
                  <p className="text-xl font-bold text-secondary">
                    {formatPrice(psychologist.pricePerHour, psychologist.currency)}
                  </p>
                </div>
              )}
              {bookable ? (
                <Button size="lg" full asChild>
                  <Link href={`/booking/${psychologist.slug}`}>
                    {isFirstConsultation
                      ? 'Réserver ma consultation gratuite'
                      : 'Prendre rendez-vous'}
                  </Link>
                </Button>
              ) : (
                <Button size="lg" full disabled title="Ce praticien n’accepte pas de réservation">
                  Réservation indisponible
                </Button>
              )}
              <Button size="lg" variant="outline-muted" full asChild>
                <Link href="/login">
                  <MessageSquare />
                  Envoyer un message
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* --- Content + booking sidebar ---------------------------------- */}
        <div className="mt-8 grid gap-8 pb-16 lg:grid-cols-[1fr_380px] lg:gap-10">
          <div className="min-w-0 space-y-6">
            {psychologist.introVideoUrl && (
              <Section title="Vidéo de présentation" icon={Video}>
                <video
                  key={psychologist.introVideoUrl}
                  className="aspect-video w-full rounded-card bg-secondary"
                  src={psychologist.introVideoUrl}
                  poster={psychologist.avatarUrl}
                  controls
                  preload="metadata"
                >
                  Votre navigateur ne prend pas en charge la lecture vidéo.
                </video>
              </Section>
            )}

            <Section title="À propos" icon={Sparkles}>
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                {psychologist.bio.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Section>

            <Section title="Spécialités et approches" icon={Sparkles}>
              <div className="space-y-5">
                <div>
                  <h3 className="mb-3 text-base font-semibold text-secondary">
                    Motifs de consultation
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {psychologist.specialties.map((s) => (
                      <Badge key={s} variant="primary" size="lg">
                        {label(SPECIALTIES, s)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-3 text-base font-semibold text-secondary">
                    Approches thérapeutiques
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {psychologist.approaches.map((a) => (
                      <Badge key={a} variant="secondary" size="lg">
                        {label(APPROACHES, a)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Parcours professionnel" icon={Building2}>
              <ol className="space-y-6">
                {psychologist.experience.map((item) => (
                  <li key={item.id} className="relative ps-6">
                    <span className="absolute start-0 top-1.5 size-2.5 rounded-full bg-primary" />
                    <span className="absolute start-[4px] top-5 h-[calc(100%+0.5rem)] w-px bg-border last:hidden" />
                    <p className="text-base font-bold text-secondary">{item.role}</p>
                    <p className="text-base text-muted-foreground">{item.organization}</p>
                    <p className="mt-0.5 text-xs text-subtle-foreground">
                      {item.startYear} — {item.endYear ?? "aujourd'hui"}
                    </p>
                    {item.description && (
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Formation et diplômes" icon={GraduationCap}>
              <ul className="space-y-4">
                {psychologist.education.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-primary-soft text-primary">
                      <GraduationCap className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-base font-bold text-secondary">{item.degree}</p>
                      <p className="text-base text-muted-foreground">{item.institution}</p>
                      <p className="mt-0.5 text-xs text-subtle-foreground">{item.year}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Langues et format" icon={Globe2}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2.5 text-base font-semibold text-secondary">
                    Langues de consultation
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {psychologist.languages.map((l) => (
                      <Badge key={l} size="lg">
                        {label(LANGUAGES, l)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2.5 text-base font-semibold text-secondary">Formats proposés</h3>
                  <div className="flex flex-wrap gap-2">
                    {psychologist.modes.map((m) => (
                      <Badge key={m} size="lg">
                        <Video className="size-3.5" aria-hidden />
                        {m === 'video' ? 'Visioconférence' : m === 'audio' ? 'Appel audio' : 'Chat'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title={`Avis (${reviews.length})`} icon={MessageSquare}>
              {reviews.length === 0 ? (
                <p className="text-base text-muted-foreground">
                  Ce praticien n’a pas encore reçu d’avis. Les avis sont publiés uniquement après une
                  consultation réellement effectuée.
                </p>
              ) : (
                <div className="space-y-6">
                  <ReviewSummary reviews={reviews} rating={psychologist.rating} />
                  <div className="space-y-4">
                    {reviews.slice(0, 6).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Booking sidebar */}
          <aside>
            <Card flat className="sticky top-28 p-6">
              <h2 className="text-md font-bold text-secondary">Réserver une consultation</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Répond en moyenne en {Math.round(psychologist.responseTimeMinutes / 60) || 1} h
              </p>
              <Separator className="my-5" />
              <BookingPanel psychologist={psychologist} acceptsBookings={bookable} />
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card flat className="p-6 lg:p-7">
      <h2 className="mb-5 flex items-center gap-2.5 text-lg font-bold text-secondary">
        <Icon className="size-5 text-primary" aria-hidden />
        {title}
      </h2>
      {children}
    </Card>
  );
}
