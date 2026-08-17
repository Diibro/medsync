import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const methodLabel: Record<string, string> = { CONSENT_CODE: "Consent code", EMERGENCY_OVERRIDE: "Emergency override" };
const statusColor: Record<string, string> = {
  ACTIVE: "text-green-400 border-green-800 bg-green-500/10",
  ENDED: "text-[#93A2C0] border-[#243149] bg-[#0F1830]",
  EXPIRED: "text-[#93A2C0] border-[#243149] bg-[#0F1830]",
};

export function SessionList({
  sessions,
}: {
  sessions: {
    id: string;
    status: string;
    method: string;
    startedAt: Date;
    flaggedForReview: boolean;
    patient: { fullName: string; publicCode: string };
  }[];
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-[#7488AA] py-6 text-center">No sessions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between border border-[#1C2740] rounded-lg px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="text-[#E7ECF5] font-medium truncate">{s.patient.fullName}</p>
            <p className="text-xs text-[#7488AA] flex items-center gap-1">
              <Clock size={10} /> {s.startedAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {s.flaggedForReview && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-300 border-amber-700/50 bg-amber-500/10">
                Flagged
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusColor[s.status] ?? ""}`}>
              {s.status === "ACTIVE" ? "Active" : methodLabel[s.method]}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
