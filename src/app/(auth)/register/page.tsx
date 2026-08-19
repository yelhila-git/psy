'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';

/** Password strength is scored on length and character variety, 0–4. */
function scorePassword(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) || /[^\w\s]/.test(value)) score++;
  return score;
}

const STRENGTH = [
  { label: 'Trop court', color: 'bg-error' },
  { label: 'Faible', color: 'bg-error' },
  { label: 'Moyen', color: 'bg-warning' },
  { label: 'Bon', color: 'bg-success' },
  { label: 'Excellent', color: 'bg-success' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accepted: false,
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const strength = scorePassword(form.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (form.firstName.trim().length < 2) next.firstName = 'Prénom requis';
    if (form.lastName.trim().length < 2) next.lastName = 'Nom requis';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Adresse e-mail invalide';
    if (!form.phone.trim()) next.phone = 'Numéro de téléphone requis';
    else if (form.phone.replace(/\D/g, '').length < 9)
      next.phone = 'Numéro de téléphone invalide';
    if (form.password.length < 8) next.password = 'Au moins 8 caractères';
    if (!form.confirmPassword) next.confirmPassword = 'Confirmez votre mot de passe';
    else if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!form.accepted) next.accepted = 'Vous devez accepter les conditions';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    toast({
      title: 'Bienvenue sur AlloMonPsy',
      description: 'Votre compte a été créé.',
      variant: 'success',
    });
    router.push('/dashboard/patient');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary">Créer votre compte</h1>
      <p className="mt-2 text-md text-muted-foreground">
        Quelques informations suffisent pour réserver votre première consultation.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" htmlFor="firstName" error={errors.firstName} required>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="Yasmine"
              value={form.firstName}
              invalid={Boolean(errors.firstName)}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              startAdornment={<User />}
            />
          </Field>

          <Field label="Nom" htmlFor="lastName" error={errors.lastName} required>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Ouhadi"
              value={form.lastName}
              invalid={Boolean(errors.lastName)}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Adresse e-mail" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={form.email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            startAdornment={<Mail />}
          />
        </Field>

        <Field label="Téléphone" htmlFor="phone" error={errors.phone} required>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+212 6 00 00 00 00"
            value={form.phone}
            invalid={Boolean(errors.phone)}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            startAdornment={<Phone />}
          />
        </Field>

        <Field
          label="Mot de passe"
          htmlFor="password"
          error={errors.password}
          hint="8 caractères minimum, avec majuscules et chiffres de préférence."
          required
        >
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="pointer-events-auto text-subtle-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
        </Field>

        {form.password && (
          <div className="flex items-center gap-3">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-full ${
                    i < strength ? STRENGTH[strength]!.color : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <span className="w-20 text-end text-xs font-medium text-muted-foreground">
              {STRENGTH[strength]!.label}
            </span>
          </div>
        )}

        <Field
          label="Confirmer le mot de passe"
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
          required
        >
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </Field>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-base text-muted-foreground">
            <Checkbox
              id="terms"
              checked={form.accepted}
              onCheckedChange={(v) => setForm({ ...form, accepted: v === true })}
              className="mt-0.5"
            />
            <span>
              J’accepte les{' '}
              <Link href="/faq" className="font-medium text-primary hover:underline">
                conditions d’utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/faq" className="font-medium text-primary hover:underline">
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          {errors.accepted && <p className="mt-1.5 text-xs font-medium text-error">{errors.accepted}</p>}
        </div>

        <Button type="submit" size="lg" full loading={submitting}>
          Créer mon compte
        </Button>
      </form>

      <p className="mt-8 text-center text-base text-muted-foreground">
        Déjà inscrit ?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
