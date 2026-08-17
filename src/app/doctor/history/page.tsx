import { History } from "lucide-react";
import { requireDoctor } from "@/lib/auth/guard";
import { listDoctorSessions } from "@/lib/access/queries";
import { SessionList } from "@/components/doctor/session-list";

export default async function DoctorHistoryPage() {
  const { doctor } = await requireDoctor();
  const sessions = await listDoctorSessions(doctor.id, 50);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <History size={20} className="text-[#7CA6E8]" />
          <div>
            <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Session history</h1>
            <p className="text-xs text-[#7488AA]">Every patient chart you&apos;ve opened, most recent first</p>
          </div>
        </div>
        <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
          <SessionList sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
