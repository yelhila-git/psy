import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { appointmentService, paymentService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/shell';
import { AppointmentTabs } from '@/components/dashboard/appointment-tabs';

export const metadata: Metadata = { title: 'Mes rendez-vous' };

export default async function PatientAppointmentsPage() {
  const [upcoming, past, paymentStatuses] = await Promise.all([
    appointmentService.list({ patientId: CURRENT_PATIENT_ID, scope: 'upcoming' }),
    appointmentService.list({ patientId: CURRENT_PATIENT_ID, scope: 'past' }),
    paymentService.statusByAppointment({ patientId: CURRENT_PATIENT_ID }),
  ]);

  return (
    <>
      <PageHeader
        title="Mes rendez-vous"
        description="Retrouvez vos consultations à venir et votre historique."
        action={
          <Button asChild>
            <Link href="/psychologists">
              <CalendarPlus />
              Nouveau rendez-vous
            </Link>
          </Button>
        }
      />
      <AppointmentTabs
        upcoming={upcoming}
        past={past}
        paymentStatuses={paymentStatuses}
        viewerRole="patient"
      />
    </>
  );
}
