"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ShieldCheck, Brain, Settings, LogOut, Heart, User } from "lucide-react";
import { logout } from "@/lib/identity/actions";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/records", label: "Health Records", icon: FileText },
  { href: "/dashboard/insights", label: "AI Insights", icon: Brain },
  { href: "/dashboard/access", label: "Access History", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ fullName, publicCode }: { fullName: string; publicCode: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-gradient-to-b from-[#1B3A6B] to-[#0F2347] text-white shrink-0 h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">MedSync</p>
            <p className="text-xs text-blue-200">Patient Portal</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{fullName}</p>
            <p className="text-xs text-blue-200">Code: {publicCode}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
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
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
