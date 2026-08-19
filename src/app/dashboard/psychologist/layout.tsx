import { currentPsychologist } from '@/lib/session';
import { paymentService } from '@/lib/services';
import { CURRENT_PSYCHOLOGIST_ID } from '@/lib/mock/patients';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function PsychologistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [psychologist, toConfirm] = await Promise.all([
    currentPsychologist(),
    paymentService.pendingConfirmationCount(CURRENT_PSYCHOLOGIST_ID),
  ]);

  return (
    <DashboardShell
      role="psychologist"
      user={{
        fullName: psychologist?.fullName ?? 'Praticien',
        avatarUrl: psychologist?.avatarUrl ?? '',
        subtitle: psychologist?.title ?? 'Psychologue',
        verified: psychologist?.isVerified,
      }}
      badges={{ '/dashboard/psychologist/payments': toConfirm }}
    >
      {children}
    </DashboardShell>
  );
}
