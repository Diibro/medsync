import { ShieldCheck, Building2, Clock, Eye } from "lucide-react";
import { requirePatient } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

const methodConfig: Record<string, string> = {
  CONSENT_CODE: "bg-blue-100 text-blue-700 border-blue-200",
  EMERGENCY_OVERRIDE: "bg-red-100 text-red-700 border-red-200",
};
const methodLabel: Record<string, string> = {
  CONSENT_CODE: "Consent Code",
  EMERGENCY_OVERRIDE: "Emergency Override",
};

function formatDuration(start: Date, end: Date | null) {
  const endTime = end ?? new Date();
  const minutes = Math.max(0, Math.round((endTime.getTime() - start.getTime()) / 60000));
  return `${minutes} min`;
}

export default async function AccessHistoryPage() {
  const { patient } = await requirePatient();
  const events = await db.accessEvent.findMany({
    where: { patientId: patient.id },
    include: { doctor: { include: { hospital: true } } },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="p-4 lg:p-6 flex flex-col h-[calc(100vh-220px)]">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Access History</h1>
          <p className="text-xs text-[#7488AA]">Audit log of doctor file access</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 shrink-0">
        <ShieldCheck size={16} className="text-[#7CA6E8]" />
        <p className="text-xs text-[#93A2C0]">{events.length} access events recorded</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 pr-2">
          {events.length === 0 && (
            <p className="text-sm text-[#7488AA] py-12 text-center">No doctor has accessed your record yet.</p>
          )}
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-[#243149] bg-[#121A2C] shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#E7ECF5]">{event.doctor.fullName}</p>
                  <p className="text-xs text-[#7488AA]">{event.doctor.specialty ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 shrink-0 ${methodConfig[event.method]}`}>
                    {methodLabel[event.method]}
                  </Badge>
                  {event.flaggedForReview && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-amber-700 border-amber-200 bg-amber-50">
                      Flagged for review
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#93A2C0] mb-3">
                <span className="flex items-center gap-1">
                  <Building2 size={11} />
                  {event.doctor.hospital.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {event.startedAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="text-[#7488AA]">
                  Status: {event.status} · Duration: {formatDuration(event.startedAt, event.endedAt)}
                </span>
              </div>

              {event.recordsViewed.length > 0 && (
                <div className="border-t border-[#1C2740] pt-2">
                  <p className="text-xs text-[#7488AA] mb-1.5 flex items-center gap-1">
                    <Eye size={11} />
                    {event.recordsViewed.length} record(s) viewed
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
