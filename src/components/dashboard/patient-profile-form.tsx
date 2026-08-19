'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import type { Patient } from '@/types';
import { formatDate } from '@/lib/utils';
import { AvatarUpload } from '@/components/dashboard/avatar-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Separator } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

export function PatientProfileForm({ patient }: { patient: Patient }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    avatarUrl: patient.avatarUrl,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone ?? '',
    city: patient.city ?? '',
    dateOfBirth: patient.dateOfBirth ?? '',
    gender: patient.gender ?? '',
    notes: patient.notes ?? '',
  });
  const [saving, setSaving] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast({ title: 'Profil mis à jour', variant: 'success' });
  };

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card className="p-6 lg:p-7">
        <h2 className="text-md font-bold text-secondary">Informations personnelles</h2>
        <Separator className="my-5" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName">
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Nom" htmlFor="lastName">
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
          <Field label="Adresse e-mail" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Date de naissance" htmlFor="dob">
            <Input
              id="dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </Field>
          <Field label="Ville" htmlFor="city">
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <Field label="Genre">
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Non renseigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Femme</SelectItem>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Separator className="my-6" />

        <Field
          label="Ce que vous souhaitez partager avec vos praticiens"
          htmlFor="notes"
          hint="Facultatif. Antécédents, traitement en cours, contexte particulier — visible uniquement par les psychologues que vous consultez."
        >
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Par exemple : suivi antérieur, traitement en cours, période de vie particulière…"
          />
        </Field>

        <div className="mt-6 flex justify-end">
          <Button type="submit" loading={saving}>
            <Save />
            Enregistrer
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6 text-center">
          <AvatarUpload
            initialSrc={patient.avatarUrl}
            name={patient.fullName}
            size="2xl"
            onChange={(avatarUrl) => setForm((f) => ({ ...f, avatarUrl }))}
          />
          <p className="mt-4 text-md font-bold text-secondary">{patient.fullName}</p>
          <p className="text-base text-muted-foreground">{patient.email}</p>
          <p className="mt-3 text-xs text-subtle-foreground">
            Membre depuis le {formatDate(patient.createdAt)}
          </p>
        </Card>

        <Card className="bg-info-soft p-5">
          <h2 className="text-base font-bold text-secondary">Vos données</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Vos informations ne sont jamais partagées avec des tiers. Vous pouvez demander leur
            export ou leur suppression à tout moment depuis les paramètres.
          </p>
        </Card>
      </div>
    </form>
  );
}
