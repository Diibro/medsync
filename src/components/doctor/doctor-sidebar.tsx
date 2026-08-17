"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Stethoscope, Building2, LogOut } from "lucide-react";
import { logout } from "@/lib/identity/actions";

const navItems = [
  { href: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/history", label: "Session History", icon: History },
];

export function DoctorSidebar({ fullName, hospitalName, licenseId }: { fullName: string; hospitalName: string; licenseId: string }) {
  const pathname = usePathname();

  // The active-session view has its own full-bleed header and timer, so the shell chrome steps
  // aside there.
  if (pathname.startsWith("/doctor/session") || pathname.startsWith("/doctor/access")) return null;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1B3A6B] to-[#0F2347] text-white shrink-0 h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-lg flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">MedSync</p>
            <p className="text-xs text-blue-200">Doctor Portal</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{fullName}</p>
            <p className="text-xs text-blue-200 truncate flex items-center gap-1">
              <Building2 size={10} /> {hospitalName}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-200/70 mt-2">License {licenseId}</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = item.href === "/doctor" ? pathname === "/doctor" : pathname.startsWith(item.href);
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
