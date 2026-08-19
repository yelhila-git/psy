'use client';

import * as React from 'react';
import { CalendarPlus, CalendarX2, History } from 'lucide-react';
import type { AppointmentWithParties, PaymentStatus, UserRole } from '@/types';
import { appointmentService } from '@/lib/services';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { AppointmentCard } from './appointment-card';

export function AppointmentTabs({
  upcoming: initialUpcoming,
  past,
  paymentStatuses,
  viewerRole,
}: {
  upcoming: AppointmentWithParties[];
  past: AppointmentWithParties[];
  /** Payment state keyed by appointment id — drives the payment line and CTAs. */
  paymentStatuses?: Record<string, PaymentStatus>;
  viewerRole: UserRole;
}) {
  const { toast } = useToast();
  const [upcoming, setUpcoming] = React.useState(initialUpcoming);
  const [cancelId, setCancelId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState('');
  const [cancelling, setCancelling] = React.useState(false);

  const confirmCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    await appointmentService.cancel(cancelId, reason || 'Annulé par l’utilisateur');
    setUpcoming((current) => current.filter((a) => a.id !== cancelId));
    setCancelling(false);
    setCancelId(null);
    setReason('');
    toast({
      title: 'Rendez-vous annulé',
      description:
        'Si vous aviez déjà effectué le transfert, contactez le psychologue pour convenir du remboursement.',
      variant: 'success',
    });
  };

  return (
    <>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            À venir
            <Badge variant="primary" size="sm" className="ms-2">
              {upcoming.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Historique
            <Badge variant="outline" size="sm" className="ms-2">
              {past.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="Aucun rendez-vous à venir"
              description={
                viewerRole === 'patient'
                  ? 'Réservez une consultation avec le praticien de votre choix.'
                  : 'Vos prochaines consultations apparaîtront ici dès qu’un patient réserve.'
              }
              action={
                viewerRole === 'patient'
                  ? { label: 'Trouver un psychologue', href: '/psychologists' }
                  : { label: 'Gérer mes disponibilités', href: '/dashboard/psychologist/availability' }
              }
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  paymentStatus={paymentStatuses?.[a.id]}
                  viewerRole={viewerRole}
                  onCancel={setCancelId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past.length === 0 ? (
            <EmptyState
              icon={History}
              title="Pas encore d’historique"
              description="Vos consultations passées seront listées ici, avec leur facture."
            />
          ) : (
            <div className="space-y-3">
              {past.map((a) => (
                <AppointmentCard key={a.id} appointment={a} viewerRole={viewerRole} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Annuler ce rendez-vous ?"
        description="L’annulation est gratuite jusqu’à 24 h avant la séance. Le remboursement d’un transfert déjà effectué se règle directement avec le psychologue."
        footer={
          <>
            <Button variant="outline-muted" onClick={() => setCancelId(null)}>
              Garder le rendez-vous
            </Button>
            <Button variant="destructive" onClick={confirmCancel} loading={cancelling}>
              <CalendarX2 />
              Confirmer l’annulation
            </Button>
          </>
        }
      >
        <Field label="Motif (facultatif)" htmlFor="cancel-reason">
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Un empêchement, un changement d’horaire…"
            className="min-h-[90px]"
          />
        </Field>
      </Modal>
    </>
  );
}
