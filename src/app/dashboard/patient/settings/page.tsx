import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { SettingsPanel } from '@/components/dashboard/settings-panel';

export const metadata: Metadata = { title: 'Paramètres' };

export default function PatientSettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Langue, notifications, sécurité et gestion de vos données."
      />
      <SettingsPanel role="patient" />
    </>
  );
}
