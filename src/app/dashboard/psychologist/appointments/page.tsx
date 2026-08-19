import type { Metadata } from 'next';
import { appointmentService, paymentService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { AppointmentTabs } from '@/components/dashboard/appointment-tabs';

export const metadata: Metadata = { title: 'Rendez-vous' };

export default async function PsychologistAppointmentsPage() {
  const [upcoming, past, paymentStatuses] = await Promise.all([
    appointmentService.list({ psychologistId: CURRENT_PSYCHOLOGIST_ID, scope: 'upcoming' }),
    appointmentService.list({ psychologistId: CURRENT_PSYCHOLOGIST_ID, scope: 'past' }),
    paymentService.statusByAppointment({ psychologistId: CURRENT_PSYCHOLOGIST_ID }),
  ]);

  return (
    <>
      <PageHeader
        title="Rendez-vous"
        description="Vos consultations à venir et votre historique de séances."
      />
      <AppointmentTabs
        upcoming={upcoming}
        past={past}
        paymentStatuses={paymentStatuses}
        viewerRole="psychologist"
      />
    </>
  );
}
