import { DashboardShell } from '@/components/dashboard/shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      role="admin"
      user={{
        fullName: 'Équipe AlloMonPsy',
        avatarUrl: '',
        subtitle: 'Administration',
      }}
    >
      {children}
    </DashboardShell>
  );
}
