"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, MessageSquarePlus, Settings } from "lucide-react";

const items = [
  { href: "/chat", label: "Chat", icon: MessageSquarePlus },
  { href: "/settings/api", label: "Settings", icon: Settings },
  { href: "/sign-in", label: "Sign in", icon: LogIn }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/chat" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={active ? "active nav-link" : "nav-link"}>
            <Icon size={18} aria-hidden="true" />
            <span className="meta">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
