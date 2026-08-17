"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hospitalNavItems, platformNavItems } from "@/components/admin/admin-sidebar";

export function AdminNav({ role }: { role: "hospital" | "platform" }) {
  const pathname = usePathname();
  const navItems = role === "hospital" ? hospitalNavItems : platformNavItems;
  const rootHref = role === "hospital" ? "/admin/hospital" : "/admin/platform";

  return (
    <nav className="lg:hidden bg-[#121A2C] border-b border-[#243149] px-2 flex items-center gap-0.5 overflow-x-auto shrink-0">
      {navItems.map((item) => {
        const active = item.href === rootHref ? pathname === rootHref : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
              active ? "border-[#3D6FC4] text-[#7CA6E8] font-medium" : "border-transparent text-[#93A2C0] hover:text-[#C3CEE3]"
            }`}
          >
            <Icon size={13} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
