import { FileText } from "lucide-react";
import { requirePatient } from "@/lib/auth/guard";
import { listPatientRecords } from "@/lib/records/queries";
import { RecordsTabs } from "@/components/patient/records-tabs";

export default async function RecordsPage() {
  const { patient } = await requirePatient();
  const records = await listPatientRecords(patient.id);

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Health Records</h1>
          <p className="text-xs text-[#7488AA]">Chronological medical history</p>
        </div>
      </div>
      <RecordsTabs records={records} />
    </div>
  );
}
