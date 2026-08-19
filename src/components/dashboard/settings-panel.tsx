'use client';

import * as React from 'react';
import { Bell, Globe, Lock, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { LOCALE_META, LOCALES, type Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Separator, Switch } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Modal } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

const NOTIFICATIONS = [
  { key: 'reminders', label: 'Rappels de rendez-vous', hint: '24 h puis 1 h avant la séance' },
  { key: 'messages', label: 'Nouveaux messages', hint: 'Par e-mail lorsqu’un message arrive' },
  { key: 'bookings', label: 'Confirmations de réservation', hint: 'Récapitulatif après chaque réservation' },
  { key: 'newsletter', label: 'Actualités et conseils', hint: 'Une fois par mois, jamais plus' },
] as const;

/** Settings are shared across roles — only the labels above vary. */
export function SettingsPanel({ role }: { role: 'patient' | 'psychologist' | 'admin' }) {
  const { toast } = useToast();

  const [locale, setLocale] = React.useState<Locale>('fr');
  const [notifications, setNotifications] = React.useState<Record<string, boolean>>({
    reminders: true,
    messages: true,
    bookings: true,
    newsletter: false,
  });
  const [twoFactor, setTwoFactor] = React.useState(false);
  const [passwords, setPasswords] = React.useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const applyLocale = (next: Locale) => {
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = LOCALE_META[next].dir;
    toast({
      title: 'Langue mise à jour',
      description: `L’interface est désormais en ${LOCALE_META[next].nativeLabel}.`,
      variant: 'success',
    });
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (passwords.current.length < 6) next.current = 'Mot de passe actuel requis';
    if (passwords.next.length < 8) next.next = 'Au moins 8 caractères';
    if (passwords.next !== passwords.confirm) next.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setPasswords({ current: '', next: '', confirm: '' });
    toast({ title: 'Mot de passe mis à jour', variant: 'success' });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Language */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Globe className="size-4 text-primary" aria-hidden />
          Langue et région
        </h2>
        <Separator className="my-5" />

        <Field
          label="Langue de l’interface"
          hint="L’arabe bascule automatiquement l’interface en lecture de droite à gauche."
        >
          <Select value={locale} onValueChange={(v) => applyLocale(v as Locale)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {LOCALE_META[code].flag} {LOCALE_META[code].nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Fuseau horaire" className="mt-4">
          <Select defaultValue="africa-casablanca">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="africa-casablanca">(GMT+1) Casablanca</SelectItem>
              <SelectItem value="europe-paris">(GMT+2) Paris</SelectItem>
              <SelectItem value="europe-london">(GMT+1) Londres</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Bell className="size-4 text-primary" aria-hidden />
          Notifications
        </h2>
        <Separator className="my-5" />

        <ul className="space-y-4">
          {NOTIFICATIONS.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-medium text-secondary">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((current) => ({ ...current, [item.key]: checked }))
                }
                aria-label={item.label}
              />
            </li>
          ))}
        </ul>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <Lock className="size-4 text-primary" aria-hidden />
          Sécurité
        </h2>
        <Separator className="my-5" />

        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Mot de passe actuel" htmlFor="current" error={errors.current}>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={passwords.current}
              invalid={Boolean(errors.current)}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="next" error={errors.next}>
            <Input
              id="next"
              type="password"
              autoComplete="new-password"
              value={passwords.next}
              invalid={Boolean(errors.next)}
              onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" htmlFor="confirm" error={errors.confirm}>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={passwords.confirm}
              invalid={Boolean(errors.confirm)}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </Field>

          <Button type="submit" loading={saving}>
            <Save />
            Mettre à jour
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-medium text-secondary">Double authentification</p>
            <p className="text-xs text-muted-foreground">
              Un code est demandé à chaque connexion depuis un nouvel appareil.
            </p>
          </div>
          <Switch
            checked={twoFactor}
            onCheckedChange={setTwoFactor}
            aria-label="Double authentification"
          />
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-error/30 p-6">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <ShieldAlert className="size-4 text-error" aria-hidden />
          Zone sensible
        </h2>
        <Separator className="my-5" />

        <div className="space-y-5">
          <div>
            <p className="text-base font-medium text-secondary">Exporter mes données</p>
            <p className="mt-1 text-base text-muted-foreground">
              Recevez une archive de vos données personnelles, rendez-vous et messages.
            </p>
            <Button variant="outline-muted" className="mt-3">
              Demander l’export
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-base font-medium text-secondary">Supprimer mon compte</p>
            <p className="mt-1 text-base text-muted-foreground">
              {role === 'psychologist'
                ? 'Votre profil sera retiré de la plateforme et vos rendez-vous à venir annulés.'
                : 'Vos rendez-vous à venir seront annulés et remboursés selon les conditions.'}{' '}
              Cette action est irréversible.
            </p>
            <Button variant="destructive" className="mt-3" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer définitivement votre compte ?"
        description="Toutes vos données seront effacées sous 30 jours, à l’exception des pièces comptables que la loi nous impose de conserver."
        size="sm"
        footer={
          <>
            <Button variant="outline-muted" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                toast({
                  title: 'Demande enregistrée',
                  description: 'Un e-mail de confirmation vous a été envoyé.',
                  variant: 'warning',
                });
              }}
            >
              Confirmer la suppression
            </Button>
          </>
        }
      />
    </div>
  );
}
