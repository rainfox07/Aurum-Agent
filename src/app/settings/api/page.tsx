import { AppShell } from "@/components/layout/app-shell";
import { ApiConfigForm } from "@/components/settings/api-config-form";
import { SettingsSubnav } from "@/components/settings/settings-subnav";

export default function ApiSettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="wide-column">
        <div className="settings-layout">
          <SettingsSubnav active="api" />
          <ApiConfigForm />
        </div>
      </div>
    </AppShell>
  );
}
