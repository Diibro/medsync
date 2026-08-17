import { requirePlatformAdmin } from "@/lib/auth/guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShieldAlert, LogOut } from "lucide-react";
import { logout } from "@/lib/identity/actions";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requirePlatformAdmin();

  return (
    <div className="h-dvh flex bg-[#0B1220] font-sans overflow-hidden">
      <AdminSidebar role="platform" title="MedSync Admin" subtitle={staff.fullName} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="lg:hidden w-full bg-gradient-to-r from-[#0F2347] to-[#0B1830] text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <ShieldAlert size={18} />
          <p className="text-sm font-semibold truncate">MedSync Admin</p>
          <form action={logout} className="ml-auto">
            <button type="submit" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
        <AdminNav role="platform" />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
