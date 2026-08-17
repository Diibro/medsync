import { ScrollText } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { listAuditLogs } from "@/lib/admin/queries";

const actionLabels: Record<string, string> = {
  "patient.registered": "Patient registered",
  "record.manual_entry.created": "Patient added a record",
  "record.document.uploaded": "Patient uploaded a document",
  "record.ocr_draft.confirmed": "Patient confirmed an AI-read document",
  "record.doctor_entry.created": "Doctor added a clinical entry",
  "hospital.linked": "Patient linked a hospital",
  "hospital.synced": "Hospital records synced",
  "hospital.write_back.succeeded": "Entry sent back to hospital",
  "hospital.write_back.failed": "Entry failed to send back to hospital",
  "access.consent_code.requested": "Doctor requested access",
  "access.consent_code.verified": "Consent code verified",
  "access.consent_code.failed": "Wrong consent code entered",
  "access.consent_code.denied": "Patient denied access",
  "access.session_started": "Doctor session started",
  "access.session_ended": "Doctor session ended",
  "access.emergency_override": "Emergency override used",
  "access.pin.failed": "Wrong PIN entered",
  "ai.drug_conflict.flagged": "AI flagged a drug conflict",
  "admin.doctor.provisioned": "Hospital admin added a doctor",
  "admin.hospital.onboarded": "Platform admin onboarded a hospital",
  "admin.research_export.downloaded": "Research export downloaded",
  "ussd.emergency_info.viewed": "Emergency info viewed by USSD",
  "ussd.records_summary.viewed": "Records viewed by USSD",
};

export default async function PlatformLogsPage() {
  await requirePlatformAdmin();
  const logs = await listAuditLogs(150);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ScrollText size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Audit log</h1>
          <p className="text-xs text-[#7488AA]">The last {logs.length} actions taken across the platform</p>
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-[#152540] sticky top-0">
              <tr className="text-left text-xs text-[#93A2C0]">
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">What happened</th>
                <th className="px-4 py-2.5 font-medium">Who</th>
                <th className="px-4 py-2.5 font-medium">IP address</th>
                <th className="px-4 py-2.5 font-medium">Device</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-[#1C2740]">
                  <td className="px-4 py-2.5 text-xs text-[#7488AA] whitespace-nowrap">
                    {log.createdAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2.5 text-[#C3CEE3] whitespace-nowrap">{actionLabels[log.action] ?? log.action}</td>
                  <td className="px-4 py-2.5 text-xs text-[#7488AA] whitespace-nowrap">
                    {log.actorRole.replaceAll("_", " ").toLowerCase()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#7488AA] font-mono whitespace-nowrap">{log.ipAddress ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[#7488AA] max-w-[220px] truncate" title={log.userAgent ?? undefined}>
                    {log.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-sm text-[#7488AA] py-8 text-center">Nothing logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
