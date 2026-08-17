import { requireHospitalAdmin } from "@/lib/auth/guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShieldAlert, LogOut } from "lucide-react";
import { logout } from "@/lib/identity/actions";

export default async function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  const { hospital } = await requireHospitalAdmin();

  return (
    <div className="h-dvh flex bg-[#0B1220] font-sans overflow-hidden">
      <AdminSidebar role="hospital" title={hospital.name} subtitle="Hospital admin" />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="lg:hidden w-full bg-gradient-to-r from-[#0F2347] to-[#0B1830] text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <ShieldAlert size={18} />
          <p className="text-sm font-semibold truncate">{hospital.name}</p>
          <form action={logout} className="ml-auto">
            <button type="submit" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
        <AdminNav role="hospital" />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
