import Link from "next/link";
import { FileText, Activity, Heart, ShieldCheck, LayoutDashboard } from "lucide-react";
import { requirePatient } from "@/lib/auth/guard";
import { getOverviewStats, listPatientRecords } from "@/lib/records/queries";
import { getPatientInsights } from "@/lib/ai/queries";
import { db } from "@/lib/db";
import { RecordCard } from "@/components/patient/record-card";
import { AIInsightsPanel } from "@/components/shared/ai-insights-panel";
import { Badge } from "@/components/ui/badge";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function OverviewPage() {
  const { patient } = await requirePatient();
  const [stats, records, recentAccess, insights] = await Promise.all([
    getOverviewStats(patient.id),
    listPatientRecords(patient.id),
    db.accessEvent.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { startedAt: "desc" },
      take: 3,
    }),
    getPatientInsights(patient.id),
  ]);

  const stat_cards = [
    { label: "Total Records", value: stats.totalRecords, sub: "", icon: <FileText size={18} className="text-blue-600" />, bg: "bg-blue-50" },
    { label: "Prescriptions", value: stats.prescriptions, sub: "", icon: <Activity size={18} className="text-green-600" />, bg: "bg-green-50" },
    { label: "Doctor Visits", value: stats.doctorVisitCount, sub: `Last: ${formatDate(stats.lastDoctorVisit)}`, icon: <Heart size={18} className="text-red-500" />, bg: "bg-red-50" },
    { label: "Access Events", value: stats.accessEventCount, sub: `Last: ${formatDate(stats.lastAccessEvent)}`, icon: <ShieldCheck size={18} className="text-purple-600" />, bg: "bg-purple-50" },
  ];

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Health Overview</h1>
          <p className="text-xs text-[#7488AA]">Your complete medical dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stat_cards.map((stat) => (
          <div key={stat.label} className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4 flex items-start gap-3">
            <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center shrink-0`}>{stat.icon}</div>
            <div>
              <p className="text-xs text-[#93A2C0]">{stat.label}</p>
              <p className="text-xl font-bold text-[#E7ECF5]">{stat.value}</p>
              {stat.sub && <p className="text-xs text-[#7488AA]">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-[#E7ECF5] flex items-center gap-2">
              <FileText size={15} className="text-[#7CA6E8]" />
              Recent Health Records
            </h2>
            <Link href="/dashboard/records" className="text-xs text-[#7CA6E8] hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto">
            {records.length === 0 && (
              <p className="text-sm text-[#7488AA] py-8 text-center">
                No records yet. Upload a document and let AI read it in, or link a hospital in Settings.
              </p>
            )}
            {records.slice(0, 6).map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <AIInsightsPanel conflicts={insights.conflicts} trends={insights.trends} />
          <Link href="/dashboard/insights" className="text-xs text-[#7CA6E8] hover:underline -mt-2">
            Record vitals & view full insights →
          </Link>

          <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#E7ECF5] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#7CA6E8]" />
                Recent Access
              </h3>
              <Link href="/dashboard/access" className="text-xs text-[#7CA6E8] hover:underline">
                View log →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentAccess.length === 0 && <p className="text-xs text-[#7488AA] py-4 text-center">No doctor has accessed your record yet.</p>}
              {recentAccess.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#1C2740] last:border-0">
                  <span className="text-[#C3CEE3] font-medium">{event.doctor.fullName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#7488AA]">{formatDate(event.startedAt)}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-600 border-blue-200 bg-blue-50">
                      {event.method === "EMERGENCY_OVERRIDE" ? "Emergency" : "Code"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
