'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { VideoOff } from 'lucide-react';
import type { AppointmentWithParties, PaymentWithParties } from '@/types';
import { appointmentService, paymentService } from '@/lib/services';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { consultationLockReason } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { ConsultationRoom } from '@/components/video/consultation-room';
import { ConsultationLocked } from '@/components/video/consultation-locked';

/**
 * The consultation route renders outside the dashboard shell — the call needs
 * the full viewport, and a sidebar during a therapy session is a distraction.
 */
export default function ConsultationPage() {
  const params = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = React.useState<AppointmentWithParties | null>(null);
  const [payment, setPayment] = React.useState<PaymentWithParties | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      appointmentService.getById(params.appointmentId),
      paymentService.getByAppointment(params.appointmentId),
    ]).then(([foundAppointment, foundPayment]) => {
      if (cancelled) return;
      setAppointment(foundAppointment);
      setPayment(foundPayment);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.appointmentId]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary">
        <div className="flex flex-col items-center gap-4">
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          <p className="text-base text-white/70">Préparation de la salle…</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary p-6">
        <div className="max-w-md text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/10 text-white">
            <VideoOff className="size-7" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-white">Consultation introuvable</h1>
          <p className="mt-3 text-md leading-relaxed text-white/70">
            Ce lien n’est plus valide ou la séance a déjà eu lieu. Retrouvez vos rendez-vous depuis
            votre tableau de bord.
          </p>
          <Button size="lg" variant="onDark" className="mt-8" asChild>
            <Link href="/dashboard/patient/appointments">Voir mes rendez-vous</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Role is inferred from the demo session identity; swap for the auth context.
  const viewerRole = appointment.patientId === CURRENT_PATIENT_ID ? 'patient' : 'psychologist';

  // The room opens only on a confirmed appointment backed by a confirmed
  // payment. Everything else lands on an explanation, never on a call.
  const lockReason = consultationLockReason(appointment, payment);
  if (lockReason) {
    return (
      <ConsultationLocked appointment={appointment} reason={lockReason} viewerRole={viewerRole} />
    );
  }

  return <ConsultationRoom appointment={appointment} viewerRole={viewerRole} />;
}
