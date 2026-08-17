import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle, Building2, LogOut, Timer, Sparkles, TrendingUp } from "lucide-react";
import { requireDoctor } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionTimer } from "@/components/doctor/session-timer";
import { ViewTracker } from "@/components/doctor/view-tracker";
import { ClinicalEntryForm } from "@/components/doctor/clinical-entry-form";
import { AIInsightsPanel } from "@/components/shared/ai-insights-panel";
import { AiReportChat } from "@/components/shared/ai-report-chat";
import { AiReportSkeleton } from "@/components/shared/ai-report-skeleton";
import { VitalsForm } from "@/components/shared/vitals-form";
import { getPatientInsights } from "@/lib/ai/queries";
import { buildPatientContext } from "@/lib/ai/context";
import { generateHealthReport, isAiConfigured, isTransientAiError } from "@/lib/ai/summary";
import { endAccessEvent, recordVitalsDuringSession } from "@/lib/access/actions";
import { askDoctorQuestion } from "@/lib/ai/actions";
import type { Conflict, TrendCard } from "@/lib/ai/rules";

const SESSION_TOTAL_SECONDS = 10 * 60;

export default async function DoctorSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { doctor } = await requireDoctor();
  const { id } = await params;

  const grant = await db.accessEvent.findUnique({ where: { id }, include: { patient: true } });
  if (!grant || grant.doctorId !== doctor.id) {
    redirect("/doctor");
  }

  // Async Server Component, runs once per request on the server (not memoized/re-rendered like a
  // client component); real-time expiry needs Date.now().
  // eslint-disable-next-line react-hooks/purity
  const isExpired = grant.status !== "ACTIVE" || grant.expiresAt.getTime() <= Date.now();
  if (isExpired && grant.status === "ACTIVE") {
    await db.accessEvent.update({ where: { id: grant.id }, data: { status: "EXPIRED" } });
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 bg-[#0B1220]">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
          <Timer size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#E7ECF5]">Session ended</h2>
        <p className="text-sm text-[#93A2C0] text-center max-w-xs">
          Your 10 minute access window is over. Everything you did is logged. Ask the patient for a
          new code to start another session.
        </p>
        <Button render={<a href="/doctor" />} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 gap-2">
          <LogOut size={15} /> Back to dashboard
        </Button>
      </div>
    );
  }

  const patient = grant.patient;
  const [records, insights] = await Promise.all([
    db.medicalRecord.findMany({
      where: { patientId: patient.id },
      select: { id: true },
      orderBy: { occurredAt: "desc" },
    }),
    getPatientInsights(patient.id),
  ]);
  const recordVitalsAction = recordVitalsDuringSession.bind(null, grant.id);
  const hasConflicts = insights.conflicts.length > 0;
  const aiConfigured = isAiConfigured();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#0B1220]">
      <ViewTracker accessEventId={grant.id} recordIds={records.map((r) => r.id)} />
      <SessionTimer expiresAt={grant.expiresAt.toISOString()} totalSeconds={SESSION_TOTAL_SECONDS} />

      <div className="px-4 py-2.5 bg-[#152540] border-b border-[#243149] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#7CA6E8] truncate">{patient.fullName}</p>
            <p className="text-xs text-[#93A2C0] flex items-center gap-1.5">
              <Building2 size={10} /> {doctor.hospital.name} · {doctor.licenseId}
            </p>
          </div>
        </div>
        <form action={endAccessEvent.bind(null, grant.id)}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-red-400 border border-red-900/50 bg-red-500/10 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={12} /> End session
          </button>
        </form>
      </div>

      <div className="px-4 py-2 bg-gradient-to-r from-[#1B3A6B] to-[#122a52] flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-amber-300" />
          <span className="text-xs text-amber-300 font-semibold">{patient.fullName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">{patient.bloodGroup ?? "Blood group unknown"}</span>
          {patient.genotype && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">{patient.genotype}</span>}
          {patient.allergies.map((a) => (
            <span key={a} className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              ⚠ {a}
            </span>
          ))}
        </div>
      </div>

      {/* AI runs automatically the moment the chart opens — this is not behind a tab or a click. */}
      <div className={`px-4 py-2.5 border-b flex items-start gap-2.5 shrink-0 ${hasConflicts ? "bg-red-500/10 border-red-900/40" : "bg-[#122a4a]/60 border-[#243149]"}`}>
        {hasConflicts ? (
          <>
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-300">
                AI found {insights.conflicts.length} conflict{insights.conflicts.length > 1 ? "s" : ""} for this patient
              </p>
              <p className="text-xs text-red-200/80 truncate">{insights.conflicts[0].warning}</p>
            </div>
          </>
        ) : (
          <>
            <Sparkles size={16} className="text-[#7CA6E8] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#C3CEE3]">AI checked this patient&apos;s prescriptions and allergies</p>
              <p className="text-xs text-[#93A2C0]">No conflicts found. {insights.trends.length > 0 ? `${insights.trends.length} vitals trend${insights.trends.length > 1 ? "s" : ""} tracked below.` : "Full detail in the Insights tab."}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 overflow-hidden flex flex-col border-b lg:border-b-0 lg:border-r border-[#243149] min-h-0 bg-[#0B1220] p-3">
          {aiConfigured ? (
            <Suspense fallback={<AiReportSkeleton />}>
              <DoctorReportSection
                accessEventId={grant.id}
                patientId={patient.id}
                conflicts={insights.conflicts}
                trends={insights.trends}
              />
            </Suspense>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs text-[#7488AA] mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> AI chart summary needs a Gemini API key. Showing rule-based insights instead.
              </p>
              <AIInsightsPanel conflicts={insights.conflicts} trends={insights.trends} />
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col overflow-hidden bg-[#121A2C]">
          <Tabs defaultValue={hasConflicts ? "insights" : "entry"} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2.5 shrink-0">
              <TabsTrigger value="entry">Entry</TabsTrigger>
              <TabsTrigger value="insights" className="gap-1">
                <TrendingUp size={12} /> Insights
                {hasConflicts && (
                  <Badge className="ml-0.5 bg-red-500 text-white border-0 px-1 py-0 text-[10px] leading-tight">
                    {insights.conflicts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="entry" className="p-4 mt-0">
                <ClinicalEntryForm accessEventId={grant.id} doctorName={doctor.fullName} />
              </TabsContent>
              <TabsContent value="insights" className="p-4 mt-0">
                <AIInsightsPanel conflicts={insights.conflicts} trends={insights.trends} compact />
              </TabsContent>
              <TabsContent value="vitals" className="p-4 mt-0">
                <VitalsForm action={recordVitalsAction} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

async function DoctorReportSection({
  accessEventId,
  patientId,
  conflicts,
  trends,
}: {
  accessEventId: string;
  patientId: string;
  conflicts: Conflict[];
  trends: TrendCard[];
}) {
  const report = await generateHealthReport(await buildPatientContext(patientId), "doctor").catch((err) => {
    if (isTransientAiError(err)) {
      console.warn("generateHealthReport (doctor): AI temporarily rate-limited/overloaded, falling back.");
    } else {
      console.error("generateHealthReport (doctor) failed:", err);
    }
    return null;
  });

  if (!report) {
    return (
      <div className="flex-1 overflow-y-auto">
        <p className="text-xs text-[#7488AA] mb-3 flex items-center gap-1.5">
          <Sparkles size={12} /> The AI summary is unavailable right now. Showing rule-based insights instead.
        </p>
        <AIInsightsPanel conflicts={conflicts} trends={trends} />
      </div>
    );
  }

  return <AiReportChat report={report} audience="doctor" askAction={askDoctorQuestion.bind(null, accessEventId)} />;
}
