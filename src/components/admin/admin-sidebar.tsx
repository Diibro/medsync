"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  MessageCircle,
  LogOut,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { logout } from "@/lib/identity/actions";

export const hospitalNavItems = [
  { href: "/admin/hospital", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/hospital/staff", label: "Staff", icon: Users },
  { href: "/admin/hospital/logs", label: "Access Log", icon: ScrollText },
  { href: "/admin/hospital/settings", label: "Settings", icon: Settings },
];

export const platformNavItems = [
  { href: "/admin/platform", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/platform/hospitals", label: "Hospitals", icon: Building2 },
  { href: "/admin/platform/logs", label: "Audit Log", icon: ScrollText },
  { href: "/admin/platform/support", label: "Support Messages", icon: MessageCircle },
];

export function AdminSidebar({
  role,
  title,
  subtitle,
}: {
  role: "hospital" | "platform";
  title: string;
  subtitle: string;
}) {
  const pathname = usePathname();
  const navItems = role === "hospital" ? hospitalNavItems : platformNavItems;
  const rootHref = role === "hospital" ? "/admin/hospital" : "/admin/platform";

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0F2347] to-[#0B1830] text-white shrink-0 h-full border-r border-white/5">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-lg flex items-center justify-center">
            <ShieldAlert size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{title}</p>
            <p className="text-xs text-blue-200 truncate">{subtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = item.href === rootHref ? pathname === rootHref : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full ${
                active ? "bg-white/10 text-white font-medium" : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
