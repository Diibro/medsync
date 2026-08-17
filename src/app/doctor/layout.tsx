import { requireDoctor } from "@/lib/auth/guard";
import { Stethoscope, Building2, LogOut } from "lucide-react";
import { logout } from "@/lib/identity/actions";
import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { DoctorNav } from "@/components/doctor/doctor-nav";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { doctor } = await requireDoctor();

  return (
    <div className="h-dvh flex bg-[#0B1220] font-sans overflow-hidden">
      <DoctorSidebar fullName={doctor.fullName} hospitalName={doctor.hospital.name} licenseId={doctor.licenseId} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="lg:hidden w-full bg-gradient-to-r from-[#1B3A6B] to-[#122a52] text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{doctor.fullName}</p>
            <p className="text-xs text-blue-200 flex items-center gap-1">
              <Building2 size={10} /> {doctor.hospital.name}
            </p>
          </div>
          <form action={logout} className="ml-auto">
            <button type="submit" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
        <DoctorNav />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
