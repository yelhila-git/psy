import { patientService } from '@/lib/services';
import { DashboardShell } from '@/components/dashboard/shell';

export default async function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patient = await patientService.current();

  return (
    <DashboardShell
      role="patient"
      user={{
        fullName: patient.fullName,
        avatarUrl: patient.avatarUrl,
        subtitle: patient.city ?? 'Patient',
      }}
    >
      {children}
    </DashboardShell>
  );
}
