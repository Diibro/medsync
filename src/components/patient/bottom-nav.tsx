"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ShieldCheck, Brain, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/records", label: "Records", icon: FileText },
  { href: "/dashboard/insights", label: "Insights", icon: Brain },
  { href: "/dashboard/access", label: "Access", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#121A2C] border-t border-[#243149] z-40">
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors ${
                active ? "text-[#7CA6E8] font-semibold" : "text-[#7488AA] hover:text-[#C3CEE3]"
              }`}
            >
              <Icon size={20} className={active ? "text-[#7CA6E8]" : "text-[#7488AA]"} />
              {item.label}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1B3A6B] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
