import Link from "next/link";

export function SettingsSubnav({ active }: { active: "api" | "memory" }) {
  return (
    <nav className="settings-subnav" aria-label="Settings navigation">
      <Link href="/settings/api" className={`settings-subnav-link ${active === "api" ? "active" : ""}`}>
        API 配置
      </Link>
      <Link href="/settings/memory" className={`settings-subnav-link ${active === "memory" ? "active" : ""}`}>
        记忆设置
      </Link>
      <Link href="/sign-in" className="settings-subnav-link">
        登录
      </Link>
    </nav>
  );
}
