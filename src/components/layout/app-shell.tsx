import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({
  title,
  children,
  rightPanel
}: {
  title?: string;
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="app-shell">
      <SideNav />
      <div className="main-region">
        <TopBar title={title} />
        {rightPanel ? (
          <div className="workbench-grid">
            <main className="content-scroll">{children}</main>
            <aside className="right-panel">{rightPanel}</aside>
          </div>
        ) : (
          <main className="content-scroll">{children}</main>
        )}
      </div>
      <MobileNav />
    </div>
  );
}

