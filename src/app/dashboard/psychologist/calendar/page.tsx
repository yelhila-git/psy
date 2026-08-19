import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { appointmentService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/shell';
import { WeeklyCalendar } from '@/components/dashboard/weekly-calendar';

export const metadata: Metadata = { title: 'Agenda' };

export default async function PsychologistCalendarPage() {
  const appointments = await appointmentService.list({
    psychologistId: CURRENT_PSYCHOLOGIST_ID,
    scope: 'all',
  });

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Vue hebdomadaire de vos consultations. Cliquez sur une séance pour ouvrir la salle."
        action={
          <Button variant="outline-muted" asChild>
            <Link href="/dashboard/psychologist/availability">
              <CalendarClock />
              Modifier mes disponibilités
            </Link>
          </Button>
        }
      />
      <WeeklyCalendar appointments={appointments} />
    </>
  );
}
