'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { ALL_TIME, DATE_PRESETS, type DateRange, type DateRangePreset } from '@/lib/date-range';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Filter state every admin table shares. Changing a filter resets the page —
 * page 4 of the old result set rarely exists in the new one.
 */
export function useTableQuery() {
  const [search, setSearchState] = React.useState('');
  const [range, setRangeState] = React.useState<DateRange>(ALL_TIME);
  const [page, setPage] = React.useState(1);

  const setSearch = React.useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setRange = React.useCallback((next: DateRange) => {
    setRangeState(next);
    setPage(1);
  }, []);

  return { search, setSearch, range, setRange, page, setPage };
}

/**
 * Search + period filter shared by every admin table. Extra per-table filters
 * (status chips and the like) slot in through `children`.
 */
export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  range,
  onRangeChange,
  dateLabel = 'Période',
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  dateLabel?: string;
  children?: React.ReactNode;
}) {
  const setPreset = (preset: DateRangePreset) => onRangeChange({ ...range, preset });

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xs">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            startAdornment={<Search />}
            aria-label={searchPlaceholder}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {children}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-base text-muted-foreground">{dateLabel}</span>
            <Select value={range.preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
              <SelectTrigger className="w-[200px]" aria-label={dateLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {range.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-muted/40 p-3">
          <label htmlFor="range-from" className="text-base text-muted-foreground">
            Du
          </label>
          <Input
            id="range-from"
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={(e) => onRangeChange({ ...range, from: e.target.value })}
            className="h-9 w-44"
          />
          <label htmlFor="range-to" className="text-base text-muted-foreground">
            au
          </label>
          <Input
            id="range-to"
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => onRangeChange({ ...range, to: e.target.value })}
            className="h-9 w-44"
          />
        </div>
      )}
    </div>
  );
}

/** Row count + active period, rendered just above a table. */
export function ResultSummary({ total, noun, period }: { total: number; noun: string; period: string }) {
  return (
    <p className="mb-3 text-base text-muted-foreground">
      <span className="font-semibold text-secondary">{total}</span> {noun}
      {total > 1 ? 's' : ''} · {period}
    </p>
  );
}
