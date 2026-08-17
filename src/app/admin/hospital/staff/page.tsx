import { Stethoscope } from "lucide-react";
import { requireHospitalAdmin } from "@/lib/auth/guard";
import { listHospitalStaff } from "@/lib/admin/queries";
import { AddDoctorForm } from "@/components/admin/add-doctor-form";

export default async function HospitalStaffPage() {
  const { hospital } = await requireHospitalAdmin();
  const doctors = await listHospitalStaff(hospital.id);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Stethoscope size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Staff</h1>
          <p className="text-xs text-[#7488AA]">{doctors.length} doctors at {hospital.name}</p>
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <div className="flex flex-col gap-2">
          {doctors.length === 0 && <p className="text-xs text-[#7488AA]">No doctors added yet.</p>}
          {doctors.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-[#1C2740] rounded-lg px-3 py-2 text-sm">
              <div>
                <p className="text-[#E7ECF5] font-medium">{d.fullName}</p>
                <p className="text-xs text-[#7488AA]">{d.specialty ?? "General"} · {d.licenseId}</p>
              </div>
            </div>
          ))}
        </div>
        <AddDoctorForm />
      </div>
    </div>
  );
}
