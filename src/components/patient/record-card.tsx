import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, FileText } from "lucide-react";
import type { RecordType } from "@/generated/prisma/enums";

const typeColor: Record<RecordType, string> = {
  DIAGNOSIS: "border-l-[#3D6FC4] bg-[#152540]/40",
  PRESCRIPTION: "border-l-emerald-400 bg-emerald-500/[0.07]",
  LAB_REPORT: "border-l-violet-400 bg-violet-500/[0.07]",
  PROCEDURE: "border-l-[#D8A05C] bg-[#D8A05C]/[0.08]",
  VACCINATION: "border-l-teal-400 bg-teal-500/[0.07]",
};
const typeBadge: Record<RecordType, string> = {
  DIAGNOSIS: "bg-blue-100 text-blue-700 border-blue-200",
  PRESCRIPTION: "bg-green-100 text-green-700 border-green-200",
  LAB_REPORT: "bg-purple-100 text-purple-700 border-purple-200",
  PROCEDURE: "bg-amber-100 text-amber-700 border-amber-200",
  VACCINATION: "bg-teal-100 text-teal-700 border-teal-200",
};
const typeLabel: Record<RecordType, string> = {
  DIAGNOSIS: "Diagnosis",
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab Report",
  PROCEDURE: "Procedure",
  VACCINATION: "Vaccination",
};
const sourceLabel: Record<string, string> = {
  HOSPITAL_SYNC: "Synced from hospital",
  DOCTOR_MANUAL: "Added by doctor",
  PATIENT_MANUAL: "Self-reported",
};

export function RecordCard({
  record,
}: {
  record: {
    id: string;
    type: RecordType;
    source: string;
    title: string;
    description: string | null;
    doctorName: string | null;
    tags: string[];
    occurredAt: Date;
    hospital: { name: string } | null;
    document: { fileName: string; storageKey: string } | null;
  };
}) {
  return (
    <div className={`rounded-xl border border-[#243149] border-l-4 ${typeColor[record.type]} p-3`}>
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${typeBadge[record.type]}`}>
          {typeLabel[record.type]}
        </Badge>
        {record.source === "PATIENT_MANUAL" && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-600 border-amber-200 bg-amber-50">
            Unverified
          </Badge>
        )}
        {record.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs px-1.5 py-0 text-[#7488AA] border-[#243149]">
            {t}
          </Badge>
        ))}
      </div>
      <p className="text-sm font-semibold text-[#E7ECF5] mb-1">{record.title}</p>
      {record.description && <p className="text-xs text-[#93A2C0] leading-relaxed mb-2">{record.description}</p>}
      {record.document && (
        <Link
          href={`/api/files/${record.document.storageKey}`}
          target="_blank"
          className="flex items-center gap-1 text-xs text-[#7CA6E8] hover:underline mb-2"
        >
          <FileText size={11} /> {record.document.fileName}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-x-3 text-xs text-[#7488AA] border-t border-[#1C2740]/80 pt-1.5">
        {record.doctorName && (
          <span className="flex items-center gap-1">
            <Stethoscope size={10} />
            {record.doctorName}
          </span>
        )}
        <span>{record.hospital?.name ?? sourceLabel[record.source]}</span>
        <span className="ml-auto">
          {record.occurredAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}
