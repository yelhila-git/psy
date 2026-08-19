import type { Metadata } from 'next';
import { CURRENT_PATIENT_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { Chat } from '@/components/chat/chat';

export const metadata: Metadata = { title: 'Messages' };

export default function PatientMessagesPage() {
  return (
    <>
      <PageHeader
        title="Messages"
        description="Échangez avec vos psychologues entre deux séances. Ces conversations sont confidentielles."
      />
      <Chat viewerId={CURRENT_PATIENT_ID} viewerRole="patient" />
    </>
  );
}
