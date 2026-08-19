'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import type { AppointmentWithParties } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DAY_START = 8;
const DAY_END = 20;
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

/**
 * Week grid for the practitioner's agenda. Appointments are absolutely
 * positioned against the hour rail so overlapping sessions stay legible, and
 * the whole grid collapses to a day-by-day list below lg.
 */
export function WeeklyCalendar({ appointments }: { appointments: AppointmentWithParties[] }) {
  const [weekOffset, setWeekOffset] = React.useState(0);

  const weekDays = React.useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    // Monday-first week.
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, AppointmentWithParties[]>();
    for (const a of appointments) {
      if (a.status === 'cancelled') continue;
      const key = new Date(a.startsAt).toDateString();
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return map;
  }, [appointments]);

  const rangeLabel = `${weekDays[0]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${weekDays[6]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="text-md font-bold capitalize text-secondary">{rangeLabel}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline-muted" size="sm" onClick={() => setWeekOffset(0)}>
            Aujourd’hui
          </Button>
          <Button
            variant="outline-muted"
            size="icon-sm"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="rtl-flip" />
          </Button>
          <Button
            variant="outline-muted"
            size="icon-sm"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="rtl-flip" />
          </Button>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[840px]">
          <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
            <span />
            {weekDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={cn('border-s border-border px-2 py-3 text-center', isToday && 'bg-primary-soft/40')}
                >
                  <p className="text-2xs uppercase text-subtle-foreground">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-md font-bold',
                      isToday ? 'text-primary' : 'text-secondary',
                    )}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
            {/* Hour rail */}
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-border pe-2 pt-1 text-end text-2xs text-subtle-foreground"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dayAppointments = byDay.get(day.toDateString()) ?? [];
              return (
                <div key={day.toISOString()} className="relative border-s border-border">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b border-border" />
                  ))}

                  {dayAppointments.map((a) => {
                    const start = new Date(a.startsAt);
                    const offsetMinutes = (start.getHours() - DAY_START) * 60 + start.getMinutes();
                    if (offsetMinutes < 0) return null;

                    return (
                      <Link
                        key={a.id}
                        href={`/consultation/${a.id}`}
                        className="absolute inset-x-1 overflow-hidden rounded-[4px] border-s-[3px] border-primary bg-primary-soft px-1.5 py-1 text-2xs transition-colors hover:bg-primary hover:text-primary-foreground"
                        style={{
                          top: `${(offsetMinutes / 60) * 64}px`,
                          height: `${Math.max(26, (a.durationMinutes / 60) * 64 - 2)}px`,
                        }}
                      >
                        <span className="block truncate font-bold">
                          {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="block truncate">{a.patient.fullName}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: day-by-day list, designed for the format rather than scaled down */}
      <div className="divide-y divide-border lg:hidden">
        {weekDays.map((day) => {
          const dayAppointments = (byDay.get(day.toDateString()) ?? []).sort((a, b) =>
            a.startsAt.localeCompare(b.startsAt),
          );
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={day.toISOString()} className="p-4">
              <div className="flex items-baseline gap-2">
                <h3 className={cn('text-base font-bold capitalize', isToday ? 'text-primary' : 'text-secondary')}>
                  {day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {isToday && <span className="text-2xs font-medium text-primary">Aujourd’hui</span>}
              </div>

              {dayAppointments.length === 0 ? (
                <p className="mt-2 text-base text-subtle-foreground">Aucune consultation</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {dayAppointments.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/consultation/${a.id}`}
                        className="flex items-center gap-3 rounded-control border border-border p-3 transition-colors hover:border-primary"
                      >
                        <span className="w-12 shrink-0 text-base font-bold text-primary">
                          {new Date(a.startsAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Avatar src={a.patient.avatarUrl} name={a.patient.fullName} size="xs" />
                        <span className="min-w-0 flex-1 truncate text-base text-secondary">
                          {a.patient.fullName}
                        </span>
                        <Video className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
