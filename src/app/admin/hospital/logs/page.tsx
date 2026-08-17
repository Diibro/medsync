import { ScrollText } from "lucide-react";
import { requireHospitalAdmin } from "@/lib/auth/guard";
import { listHospitalAccessEvents } from "@/lib/admin/queries";
import { Badge } from "@/components/ui/badge";

export default async function HospitalLogsPage() {
  const { hospital } = await requireHospitalAdmin();
  const events = await listHospitalAccessEvents(hospital.id);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ScrollText size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Access log</h1>
          <p className="text-xs text-[#7488AA]">Every patient chart your doctors have opened, most recent first</p>
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <div className="flex flex-col gap-2">
          {events.length === 0 && <p className="text-xs text-[#7488AA]">No access events yet.</p>}
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs border-b border-[#1C2740] last:border-0 py-2">
              <div>
                <span className="text-[#C3CEE3] font-medium">{e.doctor.fullName}</span>
                <span className="text-[#7488AA]"> opened {e.patient.fullName}&apos;s chart ({e.patient.publicCode})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#7488AA]">{e.startedAt.toLocaleString()}</span>
                {e.flaggedForReview && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-300 border-amber-700/50 bg-amber-500/10">
                    Flagged
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
