import { Settings, Power } from "lucide-react";
import { requireHospitalAdmin } from "@/lib/auth/guard";
import { listAllHospitals } from "@/lib/admin/queries";
import { HospitalForm } from "@/components/admin/hospital-form";
import { SyncToggle } from "@/components/admin/sync-toggle";

export default async function HospitalSettingsPage() {
  const { hospital } = await requireHospitalAdmin();
  const allHospitals = await listAllHospitals();
  const otherHospitals = allHospitals.filter((h) => h.id !== hospital.id).map((h) => ({ id: h.id, name: h.name }));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Hospital settings</h1>
          <p className="text-xs text-[#7488AA]">Keep {hospital.name}&apos;s details and connection up to date</p>
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-[#E7ECF5] flex items-center gap-1.5">
              <Power size={14} className="text-[#7CA6E8]" /> Sync with MedSync
            </p>
            <p className="text-xs text-[#7488AA] mt-0.5 max-w-sm">
              Pause this while your own system is down or being changed — MedSync will stop trying to
              fetch or send records until you resume it.
            </p>
          </div>
          <SyncToggle hospitalId={hospital.id} enabled={hospital.syncEnabled} />
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <HospitalForm
          hospital={{ ...hospital }}
          otherHospitals={otherHospitals}
        />
      </div>
    </div>
  );
}
