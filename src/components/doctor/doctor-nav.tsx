"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History } from "lucide-react";

const navItems = [
  { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/history", label: "Session History", icon: History },
];

export function DoctorNav() {
  const pathname = usePathname();

  // Desktop uses the sidebar instead. The active-session view has its own full-bleed header and
  // timer, so the tab bar steps aside there too.
  if (pathname.startsWith("/doctor/session") || pathname.startsWith("/doctor/access")) return null;

  return (
    <nav className="lg:hidden bg-[#121A2C] border-b border-[#243149] px-4 flex items-center gap-1 shrink-0">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors ${
              active ? "border-[#3D6FC4] text-[#7CA6E8] font-medium" : "border-transparent text-[#93A2C0] hover:text-[#C3CEE3]"
            }`}
          >
            <Icon size={14} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
