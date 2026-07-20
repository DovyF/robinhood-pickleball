import { requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Store configuration" />
      <SettingsForm settings={settings} />
    </div>
  );
}
