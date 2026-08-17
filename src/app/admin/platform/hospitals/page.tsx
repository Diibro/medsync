import { Building2, ChevronRight } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { listAllHospitals, getHospitalDetail } from "@/lib/admin/queries";
import { AddHospitalSheet } from "@/components/admin/add-hospital-sheet";
import { HospitalDetailSheet } from "@/components/admin/hospital-detail-sheet";
import { Badge } from "@/components/ui/badge";

export default async function PlatformHospitalsPage() {
  await requirePlatformAdmin();
  const hospitals = await listAllHospitals();
  const details = await Promise.all(hospitals.map((h) => getHospitalDetail(h.id)));
  const hospitalOptions = hospitals.map((h) => ({ id: h.id, name: h.name }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-[#7CA6E8]" />
          <div>
            <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Hospitals</h1>
            <p className="text-xs text-[#7488AA]">{hospitals.length} connected to MedSync</p>
          </div>
        </div>
        <AddHospitalSheet existingHospitals={hospitalOptions} />
      </div>

      <div className="flex flex-col gap-2">
        {details.map((hospital) => {
          if (!hospital) return null;
          return (
            <HospitalDetailSheet
              key={hospital.id}
              hospital={hospital}
              otherHospitals={hospitalOptions}
              canEdit
              trigger={
                <button className="w-full text-left bg-[#121A2C] rounded-xl border border-[#243149] hover:border-[#3D5A8A] transition-colors p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#E7ECF5] font-medium truncate">{hospital.name}</p>
                    <p className="text-xs text-[#7488AA] truncate">
                      {hospital.location ?? "No location set"} · {hospital._count.doctors} doctors · {hospital._count.externalIdentifiers} linked patients
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 ${hospital.syncEnabled ? "text-green-400 border-green-800 bg-green-500/10" : "text-amber-300 border-amber-700/50 bg-amber-500/10"}`}
                    >
                      {hospital.syncEnabled ? "Active" : "Paused"}
                    </Badge>
                    <ChevronRight size={16} className="text-[#7488AA]" />
                  </div>
                </button>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
