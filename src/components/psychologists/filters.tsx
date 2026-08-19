'use client';

import * as React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Gender, Language, PsychologistFilters, Specialty } from '@/types';
import { EXPERIENCE_BUCKETS, LANGUAGES, PRICE_RANGE, SPECIALTIES } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckboxField, RadioGroup, RadioGroupItem, Separator, Slider } from '@/components/ui/misc';

export interface FilterState {
  specialties: Specialty[];
  languages: Language[];
  gender: Gender | 'any';
  maxPrice: number;
  experience: string | 'any';
  availableWithinDays: number | 'any';
}

export const EMPTY_FILTERS: FilterState = {
  specialties: [],
  languages: [],
  gender: 'any',
  maxPrice: PRICE_RANGE.max,
  experience: 'any',
  availableWithinDays: 'any',
};

/** Translates the panel's UI state into the service's query contract. */
export function toQuery(state: FilterState): PsychologistFilters {
  const bucket = EXPERIENCE_BUCKETS.find((b) => b.value === state.experience);
  return {
    specialties: state.specialties.length ? state.specialties : undefined,
    languages: state.languages.length ? state.languages : undefined,
    gender: state.gender === 'any' ? undefined : state.gender,
    maxPrice: state.maxPrice < PRICE_RANGE.max ? state.maxPrice : undefined,
    minExperience: bucket?.min,
    maxExperience: bucket?.max,
    availableWithinDays: state.availableWithinDays === 'any' ? undefined : state.availableWithinDays,
  };
}

export function countActive(state: FilterState) {
  return (
    state.specialties.length +
    state.languages.length +
    (state.gender !== 'any' ? 1 : 0) +
    (state.maxPrice < PRICE_RANGE.max ? 1 : 0) +
    (state.experience !== 'any' ? 1 : 0) +
    (state.availableWithinDays !== 'any' ? 1 : 0)
  );
}

const AVAILABILITY_OPTIONS = [
  { value: 'any', label: 'Peu importe' },
  { value: 0, label: "Aujourd'hui" },
  { value: 2, label: 'Dans les 3 jours' },
  { value: 7, label: 'Cette semaine' },
] as const;

const GENDER_OPTIONS = [
  { value: 'any', label: 'Peu importe' },
  { value: 'female', label: 'Une femme' },
  { value: 'male', label: 'Un homme' },
] as const;

export function FilterPanel({
  state,
  onChange,
  onReset,
  className,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  className?: string;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...state, [key]: value });

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const active = countActive(state);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-md font-bold text-secondary">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          Filtres
          {active > 0 && (
            <Badge variant="solid" size="sm">
              {active}
            </Badge>
          )}
        </h2>
        {active > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-primary hover:underline"
          >
            Tout effacer
          </button>
        )}
      </div>

      <FilterGroup title="Motif de consultation">
        <div className="max-h-64 space-y-0.5 overflow-y-auto pe-1">
          {SPECIALTIES.map((s) => (
            <CheckboxField
              key={s.value}
              id={`spec-${s.value}`}
              label={s.label}
              checked={state.specialties.includes(s.value)}
              onCheckedChange={() => set('specialties', toggle(state.specialties, s.value))}
            />
          ))}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Langue de consultation">
        {LANGUAGES.map((l) => (
          <CheckboxField
            key={l.value}
            id={`lang-${l.value}`}
            label={l.label}
            checked={state.languages.includes(l.value)}
            onCheckedChange={() => set('languages', toggle(state.languages, l.value))}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup title="Tarif maximum par séance">
        <Slider
          value={[state.maxPrice]}
          onValueChange={([value]) => set('maxPrice', value ?? PRICE_RANGE.max)}
          min={20000}
          max={PRICE_RANGE.max}
          step={5000}
          aria-label="Tarif maximum"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(20000)}</span>
          <span className="font-bold text-secondary">
            {state.maxPrice >= PRICE_RANGE.max ? 'Tous les tarifs' : `≤ ${formatPrice(state.maxPrice)}`}
          </span>
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Genre du praticien">
        <RadioGroup
          value={state.gender}
          onValueChange={(value) => set('gender', value as FilterState['gender'])}
        >
          {GENDER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 py-1 text-base text-muted-foreground hover:text-secondary"
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Expérience">
        <RadioGroup value={state.experience} onValueChange={(value) => set('experience', value)}>
          <label className="flex cursor-pointer items-center gap-3 py-1 text-base text-muted-foreground hover:text-secondary">
            <RadioGroupItem value="any" />
            Peu importe
          </label>
          {EXPERIENCE_BUCKETS.map((bucket) => (
            <label
              key={bucket.value}
              className="flex cursor-pointer items-center gap-3 py-1 text-base text-muted-foreground hover:text-secondary"
            >
              <RadioGroupItem value={bucket.value} />
              {bucket.label}
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Disponibilité">
        <RadioGroup
          value={String(state.availableWithinDays)}
          onValueChange={(value) =>
            set('availableWithinDays', value === 'any' ? 'any' : Number(value))
          }
        >
          {AVAILABILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 py-1 text-base text-muted-foreground hover:text-secondary"
            >
              <RadioGroupItem value={String(option.value)} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-base font-semibold text-secondary">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Removable chips summarising the active filters above the result grid. */
export function ActiveFilterChips({
  state,
  onChange,
  onReset,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  for (const value of state.specialties) {
    chips.push({
      key: `spec-${value}`,
      label: SPECIALTIES.find((s) => s.value === value)?.label ?? value,
      clear: () => onChange({ ...state, specialties: state.specialties.filter((v) => v !== value) }),
    });
  }
  for (const value of state.languages) {
    chips.push({
      key: `lang-${value}`,
      label: LANGUAGES.find((l) => l.value === value)?.label ?? value,
      clear: () => onChange({ ...state, languages: state.languages.filter((v) => v !== value) }),
    });
  }
  if (state.gender !== 'any') {
    chips.push({
      key: 'gender',
      label: GENDER_OPTIONS.find((g) => g.value === state.gender)?.label ?? '',
      clear: () => onChange({ ...state, gender: 'any' }),
    });
  }
  if (state.maxPrice < PRICE_RANGE.max) {
    chips.push({
      key: 'price',
      label: `≤ ${formatPrice(state.maxPrice)}`,
      clear: () => onChange({ ...state, maxPrice: PRICE_RANGE.max }),
    });
  }
  if (state.experience !== 'any') {
    chips.push({
      key: 'exp',
      label: EXPERIENCE_BUCKETS.find((b) => b.value === state.experience)?.label ?? '',
      clear: () => onChange({ ...state, experience: 'any' }),
    });
  }
  if (state.availableWithinDays !== 'any') {
    chips.push({
      key: 'avail',
      label: AVAILABILITY_OPTIONS.find((a) => a.value === state.availableWithinDays)?.label ?? '',
      clear: () => onChange({ ...state, availableWithinDays: 'any' }),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-primary-soft px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {chip.label}
          <X className="size-3" aria-hidden />
          <span className="sr-only">Retirer ce filtre</span>
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2 text-xs">
        Tout effacer
      </Button>
    </div>
  );
}
