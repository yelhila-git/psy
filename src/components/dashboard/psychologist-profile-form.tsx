'use client';

import * as React from 'react';
import { FileCheck2, Save } from 'lucide-react';
import type { Psychologist } from '@/types';
import { psychologistService } from '@/lib/services';
import { APPROACHES, LANGUAGES, SPECIALTIES } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Progress, Separator } from '@/components/ui/misc';
import { Rating } from '@/components/ui/rating';
import { useToast } from '@/components/ui/toast';

export function PsychologistProfileForm({ psychologist }: { psychologist: Psychologist }) {
  const { toast } = useToast();

  const [form, setForm] = React.useState({
    avatarUrl: psychologist.avatarUrl,
    title: psychologist.title,
    headline: psychologist.headline,
    bio: psychologist.bio,
    city: psychologist.city,
    yearsOfExperience: String(psychologist.yearsOfExperience),
    pricePerHour: psychologist.pricePerHour,
    specialties: psychologist.specialties,
    approaches: psychologist.approaches,
    languages: psychologist.languages,
  });
  const [saving, setSaving] = React.useState(false);

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await psychologistService.update(psychologist.id, {
      ...form,
      yearsOfExperience: Number(form.yearsOfExperience),
    });
    setSaving(false);
    toast({ title: 'Profil mis à jour', variant: 'success' });
  };

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <Card flat className="p-6 lg:p-7">
          <h2 className="text-md font-bold text-secondary">Présentation</h2>
          <Separator className="my-5" />

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Intitulé professionnel" htmlFor="title">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Ville d’exercice" htmlFor="city">
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Field>
              <Field label="Années d’expérience" htmlFor="years">
                <Input
                  id="years"
                  type="number"
                  min={0}
                  value={form.yearsOfExperience}
                  onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                />
              </Field>
              <Field label="Tarif horaire (MAD)" htmlFor="price">
                <Input
                  id="price"
                  type="number"
                  min={150}
                  step={25}
                  value={form.pricePerHour / 100}
                  onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) * 100 })}
                />
              </Field>
            </div>

            <Field
              label="Phrase de positionnement"
              htmlFor="headline"
              hint="Affichée sous votre nom dans les résultats de recherche."
            >
              <Input
                id="headline"
                value={form.headline}
                maxLength={120}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </Field>

            <Field
              label="Biographie"
              htmlFor="bio"
              hint={`${form.bio.length}/1500 caractères`}
            >
              <Textarea
                id="bio"
                value={form.bio}
                maxLength={1500}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="min-h-[220px]"
              />
            </Field>
          </div>
        </Card>

        <Card flat className="p-6 lg:p-7">
          <h2 className="text-md font-bold text-secondary">Spécialités et approches</h2>
          <Separator className="my-5" />

          <div className="space-y-5">
            <Field label="Motifs de consultation">
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <Pill
                    key={s.value}
                    label={s.label}
                    active={form.specialties.includes(s.value)}
                    onClick={() => setForm({ ...form, specialties: toggle(form.specialties, s.value) })}
                  />
                ))}
              </div>
            </Field>

            <Field label="Approches thérapeutiques">
              <div className="flex flex-wrap gap-2">
                {APPROACHES.map((a) => (
                  <Pill
                    key={a.value}
                    label={a.label}
                    active={form.approaches.includes(a.value)}
                    onClick={() => setForm({ ...form, approaches: toggle(form.approaches, a.value) })}
                  />
                ))}
              </div>
            </Field>

            <Field label="Langues de consultation">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Pill
                    key={l.value}
                    label={l.label}
                    active={form.languages.includes(l.value)}
                    onClick={() => setForm({ ...form, languages: toggle(form.languages, l.value) })}
                  />
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              <Save />
              Enregistrer les modifications
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card flat className="p-6 text-center">
          <AvatarUpload
            initialSrc={psychologist.avatarUrl}
            name={psychologist.fullName}
            size="2xl"
            square
            ring
            onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
          />

          <p className="mt-4 text-md font-bold text-secondary">{psychologist.fullName}</p>
          <p className="text-base text-muted-foreground">{form.title}</p>
          <Rating
            value={psychologist.rating}
            count={psychologist.reviewCount}
            size="sm"
            className="mt-3 justify-center"
          />

          <Separator className="my-5" />

          <div className="text-start">
            <div className="flex items-baseline justify-between">
              <span className="text-base text-muted-foreground">Complétion</span>
              <span className="text-base font-bold text-secondary">
                {psychologist.profileCompletion}%
              </span>
            </div>
            <Progress value={psychologist.profileCompletion} className="mt-2" />
          </div>
        </Card>

        <Card flat className="p-5">
          <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
            <FileCheck2 className="size-4 text-primary" aria-hidden />
            Vérification
          </h2>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-base text-muted-foreground">Statut du profil</span>
            <StatusBadge kind="verification" status={psychologist.verificationStatus} size="sm" />
          </div>

          <Separator className="my-4" />

          <ul className="space-y-2.5">
            {(psychologist.documents ?? []).map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-base text-muted-foreground">
                  {doc.type === 'diploma'
                    ? 'Diplôme'
                    : doc.type === 'license'
                      ? 'Autorisation'
                      : doc.type === 'identity'
                        ? 'Identité'
                        : 'Assurance'}
                </span>
                <Badge variant={doc.status === 'approved' ? 'success' : 'warning'} size="sm">
                  {doc.status === 'approved' ? 'Validé' : 'En attente'}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card flat className="bg-primary-soft/50 p-5">
          <h2 className="text-base font-bold text-secondary">Votre tarif</h2>
          <p className="mt-2 text-2xl font-bold text-secondary">
            {formatPrice(form.pricePerHour, psychologist.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            pour une séance d’une heure — modifiable à tout moment
          </p>
        </Card>
      </div>
    </form>
  );
}

function Pill({
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
