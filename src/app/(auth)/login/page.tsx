'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail } from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';

const ROLES: { value: Exclude<UserRole, 'admin'> | 'admin'; label: string; home: string }[] = [
  { value: 'patient', label: 'Patient', home: '/dashboard/patient' },
  { value: 'psychologist', label: 'Psychologue', home: '/dashboard/psychologist' },
  { value: 'admin', label: 'Admin', home: '/admin' },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = React.useState<UserRole>('patient');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Adresse e-mail invalide';
    if (password.length < 6) next.password = 'Au moins 6 caractères';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    // Auth is stubbed: the role selector routes to the matching dashboard.
    // Replace with POST /api/login and a token exchange when Laravel is ready.
    await new Promise((r) => setTimeout(r, 600));
    toast({ title: 'Connexion réussie', variant: 'success' });
    router.push(ROLES.find((r) => r.value === role)!.home);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-secondary">Content de vous revoir</h1>
      <p className="mt-2 text-md text-muted-foreground">
        Connectez-vous pour retrouver vos rendez-vous et vos échanges.
      </p>

      {/* Role selector — demo affordance so every space is reachable. */}
      <div className="mt-7">
        <p className="mb-2 text-base font-medium text-secondary">Je me connecte en tant que</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              aria-pressed={role === option.value}
              className={cn(
                'rounded-control border py-2.5 text-base font-medium transition-all',
                role === option.value
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Adresse e-mail" htmlFor="email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            invalid={Boolean(errors.email)}
            onChange={(e) => setEmail(e.target.value)}
            startAdornment={<Mail />}
          />
        </Field>

        <Field label="Mot de passe" htmlFor="password" error={errors.password} required>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            invalid={Boolean(errors.password)}
            onChange={(e) => setPassword(e.target.value)}
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

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-base text-muted-foreground">
            <Checkbox id="remember" defaultChecked />
            Rester connecté
          </label>
          <Link href="/login" className="text-base font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" size="lg" full loading={submitting}>
          Se connecter
        </Button>
      </form>

      <p className="mt-8 text-center text-base text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte patient
        </Link>
      </p>
      <p className="mt-2 text-center text-base text-muted-foreground">
        Vous êtes praticien ?{' '}
        <Link href="/register/psychologist" className="font-semibold text-primary hover:underline">
          Rejoindre la plateforme
        </Link>
      </p>
    </div>
  );
}
