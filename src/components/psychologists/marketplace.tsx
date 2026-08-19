'use client';

import * as React from 'react';
import { LayoutGrid, List, Search, SearchX, SlidersHorizontal } from 'lucide-react';
import type { Paginated, Psychologist, SortOption, Specialty } from '@/types';
import { appointmentService, psychologistService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, Pagination } from '@/components/ui/feedback';
import { PsychologistCard, PsychologistCardSkeleton } from './psychologist-card';
import {
  ActiveFilterChips,
  countActive,
  EMPTY_FILTERS,
  FilterPanel,
  toQuery,
  type FilterState,
} from './filters';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'rating_desc', label: 'Mieux notés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'experience_desc', label: 'Plus expérimentés' },
  { value: 'availability', label: 'Disponibles en premier' },
];

const PER_PAGE = 9;

export function Marketplace({
  initialQuery = '',
  initialSpecialties = [],
}: {
  initialQuery?: string;
  /** Seeded from `?specialty=` so the therapy cards land on a filtered list. */
  initialSpecialties?: Specialty[];
}) {
  const [search, setSearch] = React.useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState<FilterState>({
    ...EMPTY_FILTERS,
    specialties: initialSpecialties,
  });
  const [sort, setSort] = React.useState<SortOption>('relevance');
  const [page, setPage] = React.useState(1);
  const [layout, setLayout] = React.useState<'grid' | 'row'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [result, setResult] = React.useState<Paginated<Psychologist> | null>(null);
  const [loading, setLoading] = React.useState(true);
  // Practitioners the viewer still has a free first session with. Resolved for
  // the visible page only, in one call rather than one per card.
  const [freeWith, setFreeWith] = React.useState<Set<string>>(new Set());

  // Debounce the search box so typing doesn't fire a request per keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Any change to the query itself resets to the first page — staying on
  // page 4 of a narrower result set would show an empty grid.
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, sort]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    psychologistService
      .list({ ...toQuery(filters), query: debouncedSearch || undefined, sort, page, perPage: PER_PAGE })
      .then(async (data) => {
        if (cancelled) return;
        setResult(data);
        setLoading(false);

        const ids = await appointmentService.freeConsultationPsychologistIds(
          CURRENT_PATIENT_ID,
          data.data.map((p) => p.id),
        );
        if (!cancelled) setFreeWith(ids);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters, sort, page]);

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setSearch('');
  };

  const activeCount = countActive(filters);
  const total = result?.meta.total ?? 0;

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-card border border-border bg-card p-5 shadow-card">
            <FilterPanel state={filters} onChange={setFilters} onReset={reset} />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Search + controls */}
          <div className="flex flex-col gap-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, spécialité ou ville…"
              startAdornment={<Search />}
              className="h-12"
              aria-label="Rechercher un psychologue"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base text-muted-foreground" aria-live="polite">
                {loading ? (
                  'Recherche en cours…'
                ) : (
                  <>
                    <span className="font-bold text-secondary">{total}</span>{' '}
                    {total > 1 ? 'psychologues disponibles' : 'psychologue disponible'}
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline-muted"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal />
                  Filtres
                  {activeCount > 0 && (
                    <Badge variant="solid" size="sm">
                      {activeCount}
                    </Badge>
                  )}
                </Button>

                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  <SelectTrigger className="h-9 w-[190px] text-sm">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="hidden items-center rounded-control border border-border p-0.5 sm:flex">
                  {(['grid', 'row'] as const).map((value) => {
                    const Icon = value === 'grid' ? LayoutGrid : List;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLayout(value)}
                        aria-label={value === 'grid' ? 'Vue grille' : 'Vue liste'}
                        aria-pressed={layout === value}
                        className={cn(
                          'rounded-[3px] p-1.5 transition-colors',
                          layout === value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-subtle-foreground hover:text-primary',
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <ActiveFilterChips state={filters} onChange={setFilters} onReset={reset} />
          </div>

          {/* Results */}
          <div className="mt-8">
            {loading ? (
              <div
                className={cn('grid gap-5', layout === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1')}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <PsychologistCardSkeleton key={i} layout={layout} />
                ))}
              </div>
            ) : total === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Aucun psychologue ne correspond à votre recherche"
                description="Essayez d’élargir vos critères : retirez un filtre, augmentez le tarif maximum ou acceptez une disponibilité plus lointaine."
                action={{ label: 'Réinitialiser les filtres', onClick: reset }}
                secondaryAction={{ label: 'Voir comment ça marche', href: '/how-it-works' }}
              />
            ) : (
              <>
                <div
                  className={cn('grid gap-5', layout === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1')}
                >
                  {result!.data.map((p) => (
                    <PsychologistCard
                      key={p.id}
                      psychologist={p}
                      layout={layout}
                      firstConsultationFree={freeWith.has(p.id)}
                    />
                  ))}
                </div>

                <Pagination
                  page={result!.meta.page}
                  lastPage={result!.meta.lastPage}
                  onPageChange={(next) => {
                    setPage(next);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-12"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters — a full sheet, not a cramped dropdown. */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent size="default" className="max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Filtres</DialogTitle>
          </DialogHeader>
          <FilterPanel state={filters} onChange={setFilters} onReset={reset} />
          <Button full size="lg" onClick={() => setMobileFiltersOpen(false)}>
            Afficher {total} résultat{total > 1 ? 's' : ''}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
