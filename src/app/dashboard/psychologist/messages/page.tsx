import type { Metadata } from 'next';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { PageHeader } from '@/components/dashboard/shell';
import { Chat } from '@/components/chat/chat';

export const metadata: Metadata = { title: 'Messages' };

export default function PsychologistMessagesPage() {
  return (
    <>
      <PageHeader
        title="Messages"
        description="Échangez avec vos patients entre les séances. Les conversations sont couvertes par le secret professionnel."
      />
      <Chat viewerId={CURRENT_PSYCHOLOGIST_ID} viewerRole="psychologist" />
    </>
  );
}
