import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/shell';
import { PlatformSettings } from '@/components/admin/platform-settings';

export const metadata: Metadata = { title: 'Paramètres de la plateforme' };

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Paramètres de la plateforme"
        description="Commission, règles d’annulation, vérification et contenus légaux."
      />
      <PlatformSettings />
    </>
  );
}
