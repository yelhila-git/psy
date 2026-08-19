'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Clock3,
  FileCheck2,
  Gift,
  MailCheck,
  Send,
  Trash2,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import type { Gender, Language, Specialty, TherapyApproach } from '@/types';
import { psychologistService } from '@/lib/services';
import {
  APPROACHES,
  DEFAULT_TRANSFER_METHOD,
  LANGUAGES,
  MOROCCAN_BANKS,
  SPECIALTIES,
  TRANSFER_METHOD_HINT,
  TRANSFER_METHOD_LABELS,
} from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Progress, Separator, Switch } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

const STEPS = [
  { id: 1, label: 'Identité', icon: User },
  { id: 2, label: 'Profil pro', icon: BriefcaseBusiness },
  { id: 3, label: 'Documents', icon: FileCheck2 },
  { id: 4, label: 'Tarifs', icon: Wallet },
  { id: 5, label: 'Disponibilités', icon: CalendarClock },
  { id: 6, label: 'Paiement', icon: Banknote },
] as const;

const WEEKDAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
] as const;

const DOCUMENT_TYPES = [
  { key: 'diploma', label: 'Diplôme de psychologie', hint: 'Master ou équivalent — PDF ou image' },
  { key: 'identity', label: "Pièce d'identité", hint: 'CIN ou passeport en cours de validité' },
] as const;

/**
 * Each consultation length is priced independently rather than derived from a
 * single hourly rate — a 30-minute check-in and a 90-minute first session are
 * different products, and practitioners set them differently in practice.
 * Defaults are seeded, not proportional to duration, to reflect that a longer
 * session is rarely just "price × time".
 */
const CONSULTATION_TYPES: { duration: number; label: string; defaultPrice: number }[] = [
  { duration: 30, label: '30 minutes — suivi court', defaultPrice: 25000 },
  { duration: 45, label: '45 minutes', defaultPrice: 35000 },
  { duration: 60, label: '60 minutes — séance standard', defaultPrice: 45000 },
  { duration: 90, label: '90 minutes — première séance', defaultPrice: 65000 },
];

interface OnboardingState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender | '';
  city: string;
  title: string;
  headline: string;
  bio: string;
  yearsOfExperience: string;
  specialties: Specialty[];
  approaches: TherapyApproach[];
  languages: Language[];
  degree: string;
  institution: string;
  graduationYear: string;
  documents: Record<string, string | null>;
  /** Price in centimes, keyed by duration in minutes — one rate per consultation type. */
  consultationPrices: Record<number, number>;
  durations: number[];
  availability: Record<number, { enabled: boolean; start: string; end: string }>;
  bankName: string;
  rib: string;
  accountHolder: string;
  payoutPhone: string;
}

const INITIAL_STATE: OnboardingState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  city: '',
  title: '',
  headline: '',
  bio: '',
  yearsOfExperience: '',
  specialties: [],
  approaches: [],
  languages: ['fr'],
  degree: '',
  institution: '',
  graduationYear: '',
  documents: { diploma: null, identity: null },
  consultationPrices: Object.fromEntries(
    CONSULTATION_TYPES.map((c) => [c.duration, c.defaultPrice]),
  ),
  durations: [60],
  availability: Object.fromEntries(
    WEEKDAYS.map((d) => [
      d.value,
      { enabled: d.value >= 1 && d.value <= 5, start: '09:00', end: '18:00' },
    ]),
  ),
  bankName: MOROCCAN_BANKS[0],
  rib: '',
  accountHolder: '',
  payoutPhone: '',
};

export function PsychologistOnboarding() {
  const { toast } = useToast();
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<OnboardingState>(INITIAL_STATE);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const set = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  /** Each step validates only its own fields, so users aren't blocked by later ones. */
  const validateStep = (target: number): Record<string, string> => {
    const next: Record<string, string> = {};
    if (target === 1) {
      if (state.firstName.trim().length < 2) next.firstName = 'Prénom requis';
      if (state.lastName.trim().length < 2) next.lastName = 'Nom requis';
      if (!/^\S+@\S+\.\S+$/.test(state.email)) next.email = 'Adresse e-mail invalide';
      if (state.phone.replace(/\D/g, '').length < 9) next.phone = 'Numéro de téléphone invalide';
      if (!state.gender) next.gender = 'Sélectionnez une option';
      if (state.city.trim().length < 2) next.city = 'Ville requise';
    }
    if (target === 2) {
      if (state.title.trim().length < 3) next.title = 'Intitulé requis';
      if (state.headline.trim().length < 10) next.headline = 'Décrivez votre positionnement en une phrase';
      if (state.bio.trim().length < 120) next.bio = 'Au moins 120 caractères — les patients lisent cette section';
      if (!state.yearsOfExperience || Number(state.yearsOfExperience) < 0)
        next.yearsOfExperience = 'Nombre d’années requis';
      if (!state.specialties.length) next.specialties = 'Sélectionnez au moins une spécialité';
      if (!state.languages.length) next.languages = 'Sélectionnez au moins une langue';
      if (state.degree.trim().length < 3) next.degree = 'Diplôme requis';
      if (state.institution.trim().length < 3) next.institution = 'Établissement requis';
    }
    if (target === 3) {
      for (const doc of DOCUMENT_TYPES) {
        if (!state.documents[doc.key]) {
          next[`doc-${doc.key}`] = 'Document obligatoire';
        }
      }
    }
    if (target === 4) {
      if (!state.durations.length) next.durations = 'Sélectionnez au moins un type de consultation';
      else if (state.durations.some((d) => (state.consultationPrices[d] ?? 0) < 15000))
        next.consultationPrices = 'Tarif minimum : 150 MAD par type de consultation';
    }
    if (target === 5) {
      if (!Object.values(state.availability).some((d) => d.enabled))
        next.availability = 'Activez au moins une journée';
    }
    if (target === 6) {
      if (state.accountHolder.trim().length < 3) next.accountHolder = 'Titulaire du compte requis';
      if (!/^\d{16,24}$/.test(state.rib.replace(/\s/g, ''))) next.rib = 'RIB invalide (16 à 24 chiffres)';
      // The instant transfer is sent to this number — nothing works without it.
      if (state.payoutPhone.replace(/\D/g, '').length < 9) {
        next.payoutPhone = 'Numéro de réception requis';
      }
    }
    return next;
  };

  const goNext = () => {
    const validation = validateStep(step);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setStep((s) => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    const validation = validateStep(6);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    try {
      // The platform's listing price is still a single `pricePerHour` figure
      // (used on marketplace cards, the profile header, booking). Until that
      // model grows a real per-duration price list, the 60-minute rate stands
      // in for it when offered, falling back to whichever duration the
      // practitioner did select.
      const referenceDuration = state.durations.includes(60) ? 60 : state.durations[0];
      const pricePerHour = state.consultationPrices[referenceDuration] ?? 45000;

      await psychologistService.register({
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        phone: state.phone,
        city: state.city,
        title: state.title,
        headline: state.headline,
        bio: state.bio,
        specialties: state.specialties,
        approaches: state.approaches,
        languages: state.languages,
        yearsOfExperience: Number(state.yearsOfExperience),
        pricePerHour,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast({
        title: 'L’envoi a échoué',
        description: 'Réessayez dans un instant.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SubmittedState firstName={state.firstName} />;

  const progress = ((step - 1) / STEPS.length) * 100 + 100 / STEPS.length / 2;

  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <div className="text-center">
        <p className="eyebrow">Devenir partenaire</p>
        <h1 className="mt-3 text-3xl font-bold text-secondary sm:text-4xl">
          Créez votre profil praticien
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-md leading-relaxed text-muted-foreground">
          Six étapes, environ dix minutes. Vos réponses sont conservées entre les étapes, vous
          pouvez revenir en arrière à tout moment.
        </p>
      </div>

      {/* Stepper */}
      <div className="mt-10">
        <Progress value={progress} className="h-1.5" />
        <ol className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full transition-colors',
                    done
                      ? 'bg-success text-white'
                      : active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-subtle-foreground',
                  )}
                >
                  {done ? <Check className="size-4" /> : <s.icon className="size-[18px]" />}
                </span>
                <span
                  className={cn(
                    'text-2xs font-medium sm:text-xs',
                    active ? 'text-secondary' : 'text-subtle-foreground',
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <Card className="mt-8 p-6 lg:p-8">
        {/* ---------------------------------------------------- Step 1 ---- */}
        {step === 1 && (
          <StepShell
            title="Informations personnelles"
            description="Ces informations servent à vous identifier. Seuls votre nom et votre ville seront visibles publiquement."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" htmlFor="firstName" error={errors.firstName} required>
                <Input
                  id="firstName"
                  value={state.firstName}
                  invalid={Boolean(errors.firstName)}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Chaimaa"
                />
              </Field>
              <Field label="Nom" htmlFor="lastName" error={errors.lastName} required>
                <Input
                  id="lastName"
                  value={state.lastName}
                  invalid={Boolean(errors.lastName)}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Hamouch"
                />
              </Field>
              <Field label="Adresse e-mail" htmlFor="email" error={errors.email} required>
                <Input
                  id="email"
                  type="email"
                  value={state.email}
                  invalid={Boolean(errors.email)}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="vous@exemple.com"
                />
              </Field>
              <Field label="Téléphone" htmlFor="phone" error={errors.phone} required>
                <Input
                  id="phone"
                  type="tel"
                  value={state.phone}
                  invalid={Boolean(errors.phone)}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                />
              </Field>
              <Field label="Ville d’exercice" htmlFor="city" error={errors.city} required>
                <Input
                  id="city"
                  value={state.city}
                  invalid={Boolean(errors.city)}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="Casablanca"
                />
              </Field>
              <Field label="Genre" error={errors.gender} required>
                <Select value={state.gender} onValueChange={(v) => set('gender', v as Gender)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </StepShell>
        )}

        {/* ---------------------------------------------------- Step 2 ---- */}
        {step === 2 && (
          <StepShell
            title="Informations professionnelles"
            description="C’est ce que les patients liront avant de vous choisir. Prenez le temps de le rédiger."
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Intitulé professionnel" htmlFor="title" error={errors.title} required>
                  <Input
                    id="title"
                    value={state.title}
                    invalid={Boolean(errors.title)}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="Psychologue clinicienne"
                  />
                </Field>
                <Field
                  label="Années d’expérience"
                  htmlFor="years"
                  error={errors.yearsOfExperience}
                  required
                >
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    max={60}
                    value={state.yearsOfExperience}
                    invalid={Boolean(errors.yearsOfExperience)}
                    onChange={(e) => set('yearsOfExperience', e.target.value)}
                    placeholder="9"
                  />
                </Field>
              </div>

              <Field
                label="Phrase de positionnement"
                htmlFor="headline"
                error={errors.headline}
                hint="Une ligne qui résume votre pratique — affichée sous votre nom."
                required
              >
                <Input
                  id="headline"
                  value={state.headline}
                  invalid={Boolean(errors.headline)}
                  onChange={(e) => set('headline', e.target.value)}
                  placeholder="Accompagnement de l’anxiété et des relations toxiques"
                  maxLength={120}
                />
              </Field>

              <Field
                label="Biographie"
                htmlFor="bio"
                error={errors.bio}
                hint={`${state.bio.length}/1500 caractères — expliquez votre approche et le déroulement d'une séance.`}
                required
              >
                <Textarea
                  id="bio"
                  value={state.bio}
                  invalid={Boolean(errors.bio)}
                  onChange={(e) => set('bio', e.target.value)}
                  maxLength={1500}
                  className="min-h-[180px]"
                  placeholder="Je reçois des adultes qui traversent une période difficile…"
                />
              </Field>

              <Field label="Spécialités" error={errors.specialties} required>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <TogglePill
                      key={s.value}
                      label={s.label}
                      active={state.specialties.includes(s.value)}
                      onClick={() => set('specialties', toggle(state.specialties, s.value))}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Approches thérapeutiques">
                <div className="flex flex-wrap gap-2">
                  {APPROACHES.map((a) => (
                    <TogglePill
                      key={a.value}
                      label={a.label}
                      active={state.approaches.includes(a.value)}
                      onClick={() => set('approaches', toggle(state.approaches, a.value))}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Langues de consultation" error={errors.languages} required>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <TogglePill
                      key={l.value}
                      label={l.label}
                      active={state.languages.includes(l.value)}
                      onClick={() => set('languages', toggle(state.languages, l.value))}
                    />
                  ))}
                </div>
              </Field>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Diplôme principal"
                  htmlFor="degree"
                  error={errors.degree}
                  required
                  className="sm:col-span-2"
                >
                  <Input
                    id="degree"
                    value={state.degree}
                    invalid={Boolean(errors.degree)}
                    onChange={(e) => set('degree', e.target.value)}
                    placeholder="Master en psychologie clinique"
                  />
                </Field>
                <Field label="Année" htmlFor="gradYear">
                  <Input
                    id="gradYear"
                    type="number"
                    min={1960}
                    max={2026}
                    value={state.graduationYear}
                    onChange={(e) => set('graduationYear', e.target.value)}
                    placeholder="2017"
                  />
                </Field>
                <Field
                  label="Établissement"
                  htmlFor="institution"
                  error={errors.institution}
                  required
                  className="sm:col-span-3"
                >
                  <Input
                    id="institution"
                    value={state.institution}
                    invalid={Boolean(errors.institution)}
                    onChange={(e) => set('institution', e.target.value)}
                    placeholder="Université Mohammed V, Rabat"
                  />
                </Field>
              </div>
            </div>
          </StepShell>
        )}

        {/* ---------------------------------------------------- Step 3 ---- */}
        {step === 3 && (
          <StepShell
            title="Pièces justificatives"
            description="Notre équipe vérifie chaque document sous 48 à 72 heures ouvrées. Ils ne sont jamais visibles par les patients."
          >
            <div className="space-y-3">
              {DOCUMENT_TYPES.map((doc) => {
                const uploaded = state.documents[doc.key];
                const error = errors[`doc-${doc.key}`];
                return (
                  <div
                    key={doc.key}
                    className={cn(
                      'flex items-center gap-4 rounded-card border p-4 transition-colors',
                      uploaded ? 'border-success/40 bg-success-soft/40' : error ? 'border-error' : 'border-border',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-card',
                        uploaded ? 'bg-success/15 text-success' : 'bg-muted text-subtle-foreground',
                      )}
                    >
                      {uploaded ? <Check className="size-5" /> : <Upload className="size-5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-secondary">
                        {doc.label}
                        <span className="ms-1 text-error">*</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {uploaded ?? doc.hint}
                      </p>
                      {error && <p className="mt-1 text-xs font-medium text-error">{error}</p>}
                    </div>

                    {uploaded ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Retirer ${doc.label}`}
                        onClick={() =>
                          set('documents', { ...state.documents, [doc.key]: null })
                        }
                      >
                        <Trash2 />
                      </Button>
                    ) : (
                      <label className="shrink-0">
                        <span className="inline-flex h-9 cursor-pointer items-center rounded-control border border-border px-4 text-xs font-medium text-secondary transition-colors hover:border-primary hover:text-primary">
                          Choisir un fichier
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              set('documents', { ...state.documents, [doc.key]: file.name });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-5 rounded-card bg-info-soft p-4 text-base leading-relaxed text-muted-foreground">
              Formats acceptés : PDF, JPG, PNG (5 Mo maximum par fichier). Vos documents sont
              stockés de façon chiffrée et supprimés si votre candidature n’aboutit pas.
            </p>
          </StepShell>
        )}

        {/* ---------------------------------------------------- Step 4 ---- */}
        {step === 4 && (
          <StepShell
            title="Vos tarifs"
            description="Chaque type de consultation a son propre tarif — une séance de 30 minutes et une première séance de 90 minutes ne se facturent pas au même prix. Activez les formats que vous proposez et fixez leur tarif."
          >
            <Field
              label="Types de consultation proposés"
              error={errors.durations ?? errors.consultationPrices}
              required
            >
              <div className="space-y-2.5">
                {CONSULTATION_TYPES.map(({ duration, label }) => {
                  const enabled = state.durations.includes(duration);
                  const price = state.consultationPrices[duration] ?? 0;
                  const priceInvalid = enabled && price < 15000;

                  return (
                    <div
                      key={duration}
                      className={cn(
                        'flex flex-wrap items-center gap-4 rounded-card border p-4 transition-colors',
                        enabled ? 'border-border bg-background' : 'border-border/60 bg-muted/40',
                      )}
                    >
                      <label className="flex min-w-[220px] flex-1 cursor-pointer items-center gap-3">
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => set('durations', toggle(state.durations, duration))}
                          aria-label={`Proposer ${label}`}
                        />
                        <span
                          className={cn(
                            'text-base font-medium',
                            enabled ? 'text-secondary' : 'text-subtle-foreground',
                          )}
                        >
                          {label}
                        </span>
                      </label>

                      {enabled ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={150}
                            max={2000}
                            step={25}
                            value={price / 100}
                            invalid={priceInvalid}
                            aria-label={`Tarif pour ${label}`}
                            onChange={(e) =>
                              set('consultationPrices', {
                                ...state.consultationPrices,
                                [duration]: Number(e.target.value) * 100,
                              })
                            }
                            className="h-9 w-28"
                          />
                          <span className="text-xs text-muted-foreground">MAD</span>
                        </div>
                      ) : (
                        <span className="text-base text-subtle-foreground">Non proposé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>

            {/* Earnings preview — makes the commission concrete rather than
                abstract, per type of consultation actually offered. */}
            {state.durations.length > 0 && (
              <div className="mt-6 rounded-card border border-border bg-surface-alt p-5">
                <h3 className="text-base font-bold text-secondary">Ce que vous percevez</h3>
                <dl className="mt-4 space-y-3 text-base">
                  {CONSULTATION_TYPES.filter((c) => state.durations.includes(c.duration)).map(
                    ({ duration, label }) => (
                      <div key={duration} className="flex items-center justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-end font-bold text-success">
                          {formatPrice(state.consultationPrices[duration] ?? 0)}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  Vous percevez <span className="font-bold text-secondary">100 %</span> de ces
                  montants : le patient vous règle directement et AlloMonPsy ne prélève aucune
                  commission. Seul votre abonnement mensuel est facturé par la plateforme.
                </p>
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Gift className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  La première consultation avec chaque nouveau patient est offerte : elle vous fait
                  connaître et n’est jamais facturée au patient.
                </p>
              </div>
            )}
          </StepShell>
        )}

        {/* ---------------------------------------------------- Step 5 ---- */}
        {step === 5 && (
          <StepShell
            title="Vos disponibilités"
            description="Définissez vos plages horaires habituelles. Vous pourrez bloquer des créneaux ponctuellement depuis votre agenda."
          >
            {errors.availability && (
              <p className="mb-4 rounded-control bg-error-soft px-4 py-2.5 text-base font-medium text-error">
                {errors.availability}
              </p>
            )}

            <div className="space-y-2">
              {WEEKDAYS.map((day) => {
                const slot = state.availability[day.value]!;
                return (
                  <div
                    key={day.value}
                    className={cn(
                      'flex flex-wrap items-center gap-4 rounded-card border p-4 transition-colors',
                      slot.enabled ? 'border-border bg-background' : 'border-border/60 bg-muted/40',
                    )}
                  >
                    <div className="flex min-w-[150px] items-center gap-3">
                      <Switch
                        checked={slot.enabled}
                        onCheckedChange={(enabled) =>
                          set('availability', {
                            ...state.availability,
                            [day.value]: { ...slot, enabled },
                          })
                        }
                        aria-label={`Activer ${day.label}`}
                      />
                      <span
                        className={cn(
                          'text-base font-medium',
                          slot.enabled ? 'text-secondary' : 'text-subtle-foreground',
                        )}
                      >
                        {day.label}
                      </span>
                    </div>

                    {slot.enabled ? (
                      <div className="flex items-center gap-2">
                        <Clock3 className="size-4 text-subtle-foreground" aria-hidden />
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            set('availability', {
                              ...state.availability,
                              [day.value]: { ...slot, start: e.target.value },
                            })
                          }
                          className="h-9 w-32"
                          aria-label={`Heure de début ${day.label}`}
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            set('availability', {
                              ...state.availability,
                              [day.value]: { ...slot, end: e.target.value },
                            })
                          }
                          className="h-9 w-32"
                          aria-label={`Heure de fin ${day.label}`}
                        />
                      </div>
                    ) : (
                      <span className="text-base text-subtle-foreground">Fermé</span>
                    )}
                  </div>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* ---------------------------------------------------- Step 6 ---- */}
        {step === 6 && (
          <StepShell
            title="Informations de paiement"
            description="Vos patients vous règlent directement par transfert instantané. Ces coordonnées ne leur sont communiquées qu’après réservation d’un créneau avec vous."
          >
            <div className="flex items-start gap-3 rounded-card border border-primary bg-primary-soft/40 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
                <Banknote className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-secondary">
                  {TRANSFER_METHOD_LABELS[DEFAULT_TRANSFER_METHOD]}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {TRANSFER_METHOD_HINT}. C’est la seule méthode acceptée sur AlloMonPsy.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Field
                label="Numéro de réception"
                htmlFor="payout-phone"
                error={errors.payoutPhone}
                hint="Le numéro auquel vos patients enverront le transfert."
                required
              >
                <Input
                  id="payout-phone"
                  type="tel"
                  value={state.payoutPhone}
                  invalid={Boolean(errors.payoutPhone)}
                  onChange={(e) => set('payoutPhone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </Field>

              <Field
                label="Titulaire du compte"
                htmlFor="holder"
                error={errors.accountHolder}
                required
              >
                <Input
                  id="holder"
                  value={state.accountHolder}
                  invalid={Boolean(errors.accountHolder)}
                  onChange={(e) => set('accountHolder', e.target.value)}
                  placeholder="Nom tel qu’il figure sur le compte"
                />
              </Field>

              <Field label="Banque" required>
                <Select value={state.bankName} onValueChange={(value) => set('bankName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOROCCAN_BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="RIB" htmlFor="rib" error={errors.rib} hint="24 chiffres" required>
                <Input
                  id="rib"
                  inputMode="numeric"
                  value={state.rib}
                  invalid={Boolean(errors.rib)}
                  onChange={(e) => set('rib', e.target.value.replace(/\D/g, '').slice(0, 24))}
                  placeholder="230780123456789012345678"
                  className="font-mono"
                />
              </Field>

            </div>

            <p className="mt-6 rounded-card bg-info-soft p-4 text-base leading-relaxed text-muted-foreground">
              Vous encaissez l’intégralité du tarif de vos séances : AlloMonPsy ne prélève aucune
              commission. La plateforme se rémunère uniquement par votre abonnement mensuel, que
              vous choisirez après validation de votre profil.
            </p>

            <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-base text-muted-foreground">
              <Checkbox id="psy-terms" defaultChecked className="mt-0.5" />
              <span>
                Je certifie l’exactitude des informations fournies et j’accepte les{' '}
                <Link href="/faq" className="font-medium text-primary hover:underline">
                  conditions partenaires
                </Link>
                , dont l’abonnement mensuel de la plateforme.
              </span>
            </label>
          </StepShell>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button variant="ghost" onClick={goBack} disabled={step === 1}>
            <ArrowLeft className="rtl-flip" />
            Retour
          </Button>

          <span className="text-xs text-subtle-foreground">
            Étape {step} sur {STEPS.length}
          </span>

          {step < STEPS.length ? (
            <Button onClick={goNext}>
              Continuer
              <ArrowRight className="rtl-flip" />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} size="lg">
              <Send />
              Soumettre mon profil
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-secondary">{title}</h2>
      <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{description}</p>
      <Separator className="my-6" />
      {children}
    </div>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
      )}
    >
      {label}
    </button>
  );
}

/** Terminal state after submission — the profile now sits in the admin queue. */
function SubmittedState({ firstName }: { firstName: string }) {
  const NEXT = [
    {
      icon: FileCheck2,
      title: 'Vérification des documents',
      body: 'Notre équipe contrôle votre diplôme et votre pièce d’identité.',
    },
    {
      icon: MailCheck,
      title: 'Réponse sous 48 à 72 h',
      body: 'Vous recevrez un e-mail dès que la décision est prise, avec les éventuels compléments demandés.',
    },
    {
      icon: CalendarClock,
      title: 'Mise en ligne du profil',
      body: 'Une fois approuvé, votre profil apparaît dans les résultats et vous pouvez recevoir vos premières demandes.',
    },
  ];

  return (
    <div className="container-page max-w-3xl py-16 lg:py-24">
      <div className="text-center">
        <span className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-warning-soft text-warning">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-warning/30" aria-hidden />
          <Clock3 className="relative size-9" aria-hidden />
        </span>

        <Badge variant="warning" size="lg" className="mt-6">
          Profil en cours de vérification
        </Badge>

        <h1 className="mt-5 text-3xl font-bold text-secondary sm:text-4xl">
          Merci {firstName || ''}, votre profil est en cours d’examen
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-md leading-relaxed text-muted-foreground">
          Nous avons bien reçu votre candidature. Un membre de l’équipe vérifie vos documents et
          revient vers vous sous 48 à 72 heures ouvrées. Vous n’avez rien d’autre à faire pour
          l’instant.
        </p>
      </div>

      <ol className="mt-12 space-y-3">
        {NEXT.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex gap-4 rounded-card border border-border bg-card p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-card bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold text-secondary">
                {i + 1}. {title}
              </p>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/dashboard/psychologist">Accéder à mon tableau de bord</Link>
        </Button>
        <Button size="lg" variant="outline-muted" asChild>
          <Link href="/">Retour à l’accueil</Link>
        </Button>
      </div>
    </div>
  );
}
