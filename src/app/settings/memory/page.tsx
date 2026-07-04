import { AppShell } from "@/components/layout/app-shell";
import { MemorySettingsPanel } from "@/components/settings/memory-settings-panel";
import { SettingsSubnav } from "@/components/settings/settings-subnav";

export default function MemorySettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="wide-column">
        <div className="settings-layout">
          <SettingsSubnav active="memory" />
          <MemorySettingsPanel />
        </div>
      </div>
    </AppShell>
  );
}
