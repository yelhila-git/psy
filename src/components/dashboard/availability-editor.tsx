'use client';

import * as React from 'react';
import { AlertCircle, CalendarOff, Clock3, Copy, Info, Plus, Save, Trash2 } from 'lucide-react';
import type { AvailabilityRule, Psychologist, TimeRange } from '@/types';
import { psychologistService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator, Switch } from '@/components/ui/misc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

const DAY_LABELS: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  0: 'Dimanche',
};

const ORDER = [1, 2, 3, 4, 5, 6, 0];

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const rangeMinutes = (range: TimeRange) =>
  Math.max(0, toMinutes(range.endTime) - toMinutes(range.startTime));

/**
 * Blocks must each end after they start, and two blocks on the same day may not
 * overlap — otherwise the slot generator would emit the same hour twice.
 */
function dayError(rule: AvailabilityRule): string | null {
  if (!rule.enabled) return null;
  if (rule.ranges.length === 0) return 'Ajoutez au moins un créneau ou fermez la journée.';

  if (rule.ranges.some((r) => rangeMinutes(r) === 0))
    return 'L’heure de fin doit être postérieure à l’heure de début.';

  const sorted = [...rule.ranges].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (toMinutes(sorted[i]!.startTime) < toMinutes(sorted[i - 1]!.endTime))
      return 'Deux créneaux se chevauchent.';
  }
  return null;
}

export function AvailabilityEditor({ psychologist }: { psychologist: Psychologist }) {
  const { toast } = useToast();
  const [rules, setRules] = React.useState<AvailabilityRule[]>(psychologist.availability);
  const [accepting, setAccepting] = React.useState(psychologist.acceptsNewPatients);
  const [bufferMinutes, setBufferMinutes] = React.useState('15');
  const [noticeHours, setNoticeHours] = React.useState('24');
  const [saving, setSaving] = React.useState(false);

  const update = (weekday: number, patch: Partial<AvailabilityRule>) =>
    setRules((current) => current.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));

  const updateRange = (weekday: number, rangeId: string, patch: Partial<TimeRange>) =>
    setRules((current) =>
      current.map((r) =>
        r.weekday === weekday
          ? { ...r, ranges: r.ranges.map((x) => (x.id === rangeId ? { ...x, ...patch } : x)) }
          : r,
      ),
    );

  const removeRange = (weekday: number, rangeId: string) =>
    setRules((current) =>
      current.map((r) =>
        r.weekday === weekday ? { ...r, ranges: r.ranges.filter((x) => x.id !== rangeId) } : r,
      ),
    );

  /** New blocks start an hour after the last one ends, so they never overlap. */
  const addRange = (weekday: number) =>
    setRules((current) =>
      current.map((r) => {
        if (r.weekday !== weekday) return r;
        const last = [...r.ranges].sort((a, b) => toMinutes(a.endTime) - toMinutes(b.endTime)).at(-1);
        const start = last ? Math.min(toMinutes(last.endTime) + 60, 23 * 60) : 9 * 60;
        return {
          ...r,
          ranges: [
            ...r.ranges,
            {
              id: `range-${weekday}-${Date.now()}`,
              startTime: toTime(start),
              endTime: toTime(Math.min(start + 60, 24 * 60)),
            },
          ],
        };
      }),
    );

  /** Enabling an empty day would otherwise show an error state straight away. */
  const toggleDay = (weekday: number, enabled: boolean) => {
    update(weekday, { enabled });
    if (enabled) {
      const rule = rules.find((r) => r.weekday === weekday);
      if (rule && rule.ranges.length === 0) addRange(weekday);
    }
  };

  /** Copies a day's blocks onto every other open day — the usual "same every day" case. */
  const copyToAllDays = (weekday: number) => {
    const source = rules.find((r) => r.weekday === weekday);
    if (!source) return;
    setRules((current) =>
      current.map((r) =>
        r.weekday === weekday || !r.enabled
          ? r
          : {
              ...r,
              ranges: source.ranges.map((range, i) => ({
                ...range,
                id: `range-${r.weekday}-${Date.now()}-${i}`,
              })),
            },
      ),
    );
    toast({ title: `Créneaux du ${DAY_LABELS[weekday]?.toLowerCase()} copiés sur les autres jours` });
  };

  const openDays = rules.filter((r) => r.enabled).length;

  /** Total weekly hours — a quick sanity check on what's actually offered. */
  const weeklyHours = rules
    .filter((r) => r.enabled)
    .reduce((sum, r) => sum + r.ranges.reduce((s, range) => s + rangeMinutes(range), 0) / 60, 0);

  const hasErrors = rules.some((r) => dayError(r) !== null);

  const save = async () => {
    if (hasErrors) return;
    setSaving(true);
    await psychologistService.update(psychologist.id, {
      availability: rules,
      acceptsNewPatients: accepting,
    });
    setSaving(false);
    toast({
      title: 'Disponibilités enregistrées',
      description: `${openDays} jour${openDays > 1 ? 's' : ''} ouvert${openDays > 1 ? 's' : ''}, ${weeklyHours.toFixed(0)} h par semaine.`,
      variant: 'success',
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-md font-bold text-secondary">Horaires hebdomadaires</h2>
          <span className="text-base text-muted-foreground">
            {openDays} jour{openDays > 1 ? 's' : ''} · {weeklyHours.toFixed(0)} h par semaine
          </span>
        </div>

        <Separator className="my-5" />

        <div className="space-y-2">
          {ORDER.map((weekday) => {
            const rule = rules.find((r) => r.weekday === weekday);
            if (!rule) return null;
            const error = dayError(rule);
            const dayHours = rule.ranges.reduce((s, range) => s + rangeMinutes(range), 0) / 60;

            return (
              <div
                key={weekday}
                className={cn(
                  'rounded-card border p-4 transition-colors',
                  rule.enabled ? 'border-border bg-background' : 'border-border/60 bg-muted/40',
                  error && 'border-error/40',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => toggleDay(weekday, enabled)}
                      aria-label={`Activer ${DAY_LABELS[weekday]}`}
                    />
                    <span
                      className={cn(
                        'text-base font-medium',
                        rule.enabled ? 'text-secondary' : 'text-subtle-foreground',
                      )}
                    >
                      {DAY_LABELS[weekday]}
                    </span>
                  </div>

                  {rule.enabled ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-subtle-foreground">
                        {rule.ranges.length} créneau{rule.ranges.length > 1 ? 'x' : ''} ·{' '}
                        {dayHours.toFixed(dayHours % 1 ? 1 : 0)} h
                      </span>
                      {rule.ranges.length > 0 && (
                        <button
                          type="button"
                          onClick={() => copyToAllDays(weekday)}
                          className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                        >
                          <Copy className="size-3.5" aria-hidden />
                          Copier sur tous les jours
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-base text-subtle-foreground">
                      <CalendarOff className="size-4" aria-hidden />
                      Fermé
                    </span>
                  )}
                </div>

                {rule.enabled && (
                  <div className="mt-4 space-y-2 ps-1">
                    {rule.ranges.map((range) => (
                      <div key={range.id} className="flex flex-wrap items-center gap-2">
                        <Clock3 className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                        <Input
                          type="time"
                          value={range.startTime}
                          onChange={(e) =>
                            updateRange(weekday, range.id, { startTime: e.target.value })
                          }
                          className="h-9 w-32"
                          aria-label={`Début du créneau ${DAY_LABELS[weekday]}`}
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={range.endTime}
                          onChange={(e) =>
                            updateRange(weekday, range.id, { endTime: e.target.value })
                          }
                          className="h-9 w-32"
                          aria-label={`Fin du créneau ${DAY_LABELS[weekday]}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeRange(weekday, range.id)}
                          className="flex size-9 items-center justify-center rounded-control text-subtle-foreground transition-colors hover:bg-error-soft hover:text-error"
                          aria-label={`Supprimer le créneau ${range.startTime}–${range.endTime}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addRange(weekday)}
                      className="flex items-center gap-1.5 rounded-control px-2 py-1.5 text-base font-medium text-primary transition-colors hover:bg-primary-soft"
                    >
                      <Plus className="size-4" aria-hidden />
                      Ajouter un créneau
                    </button>

                    {error && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-error">
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-4">
          {hasErrors && (
            <span className="text-xs font-medium text-error">
              Corrigez les créneaux en rouge avant d’enregistrer.
            </span>
          )}
          <Button onClick={save} loading={saving} disabled={hasErrors}>
            <Save />
            Enregistrer
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="text-md font-bold text-secondary">Nouveaux patients</h2>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-secondary">Accepter de nouveaux patients</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Désactivez cette option pour rester visible tout en suspendant les nouvelles
                réservations.
              </p>
            </div>
            <Switch
              checked={accepting}
              onCheckedChange={setAccepting}
              aria-label="Accepter de nouveaux patients"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-md font-bold text-secondary">Règles de réservation</h2>
          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <label htmlFor="buffer" className="mb-1.5 block text-base font-medium text-secondary">
                Pause entre deux séances
              </label>
              <Select value={bufferMinutes} onValueChange={setBufferMinutes}>
                <SelectTrigger id="buffer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['0', '10', '15', '30'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === '0' ? 'Aucune' : `${value} minutes`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="notice" className="mb-1.5 block text-base font-medium text-secondary">
                Délai minimum de réservation
              </label>
              <Select value={noticeHours} onValueChange={setNoticeHours}>
                <SelectTrigger id="notice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['2', '12', '24', '48'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value} heures à l’avance
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="bg-info-soft p-5">
          <Info className="size-5 text-primary" aria-hidden />
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Pour bloquer une date précise (congés, formation), utilisez l’agenda : les exceptions
            ponctuelles ne modifient pas vos horaires récurrents.
          </p>
        </Card>
      </div>
    </div>
  );
}
