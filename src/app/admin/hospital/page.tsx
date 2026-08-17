import Link from "next/link";
import { Users, Activity, AlertTriangle, ScrollText, ArrowRight } from "lucide-react";
import { requireHospitalAdmin } from "@/lib/auth/guard";
import { getHospitalStats, listHospitalStaff } from "@/lib/admin/queries";

export default async function HospitalAdminOverviewPage() {
  const { hospital } = await requireHospitalAdmin();
  const [stats, staff] = await Promise.all([getHospitalStats(hospital.id), listHospitalStaff(hospital.id)]);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="rounded-2xl bg-linear-to-r from-[#1B3A6B] via-[#20447F] to-[#2A5298] p-6 text-white">
        <h1 className="text-xl font-bold">{hospital.name}</h1>
        <p className="text-sm text-blue-100 mt-1">A look at your hospital&apos;s activity on MedSync.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Doctors", value: stats.doctorCount, icon: <Users size={16} className="text-[#7CA6E8]" /> },
          { label: "Sessions today", value: stats.sessionsToday, icon: <Activity size={16} className="text-green-400" /> },
          { label: "Total sessions", value: stats.totalSessions, icon: <ScrollText size={16} className="text-blue-400" /> },
          { label: "Flagged", value: stats.flagged, icon: <AlertTriangle size={16} className="text-red-400" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xl font-bold text-[#E7ECF5] leading-tight">{s.value}</p>
              <p className="text-xs text-[#7488AA]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#E7ECF5]">Staff</h2>
          <Link href="/admin/hospital/staff" className="text-xs text-[#7CA6E8] hover:underline flex items-center gap-1">
            Manage <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {staff.length === 0 && <p className="text-xs text-[#7488AA]">No doctors added yet.</p>}
          {staff.slice(0, 5).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm border-b border-[#1C2740] last:border-0 py-2">
              <span className="text-[#C3CEE3]">{d.fullName}</span>
              <span className="text-xs text-[#7488AA]">{d.specialty ?? "General"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
