import { Suspense } from "react";
import { Brain, Sparkles } from "lucide-react";
import { requirePatient } from "@/lib/auth/guard";
import { getPatientInsights } from "@/lib/ai/queries";
import { AIInsightsPanel } from "@/components/shared/ai-insights-panel";
import { AiReportChat } from "@/components/shared/ai-report-chat";
import { AiReportSkeleton } from "@/components/shared/ai-report-skeleton";
import { VitalsForm } from "@/components/shared/vitals-form";
import { recordVitals } from "@/lib/records/actions";
import { buildPatientContext } from "@/lib/ai/context";
import { generateHealthReport, isAiConfigured, isTransientAiError } from "@/lib/ai/summary";
import { askPatientQuestion } from "@/lib/ai/actions";
import type { Conflict, TrendCard } from "@/lib/ai/rules";

export default async function InsightsPage() {
  const { patient } = await requirePatient();
  const { conflicts, trends } = await getPatientInsights(patient.id);
  const aiConfigured = isAiConfigured();

  return (
    <div className="p-4 lg:p-6 max-w-2xl flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Brain size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">AI Health Insights</h1>
          <p className="text-xs text-[#7488AA]">A plain-language summary of your health record</p>
        </div>
      </div>

      {aiConfigured ? (
        <div className="h-[70vh] max-h-[700px] min-h-[420px]">
          <Suspense fallback={<AiReportSkeleton />}>
            <PatientReportSection patientId={patient.id} conflicts={conflicts} trends={trends} />
          </Suspense>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#7488AA] flex items-center gap-1.5">
            <Sparkles size={12} /> The AI summary needs a Gemini API key. Showing the rule-based insights instead.
          </p>
          <AIInsightsPanel conflicts={conflicts} trends={trends} />
        </>
      )}

      <VitalsForm action={recordVitals} />
    </div>
  );
}

async function PatientReportSection({
  patientId,
  conflicts,
  trends,
}: {
  patientId: string;
  conflicts: Conflict[];
  trends: TrendCard[];
}) {
  const report = await generateHealthReport(await buildPatientContext(patientId), "patient").catch((err) => {
    if (isTransientAiError(err)) {
      console.warn("generateHealthReport (patient): AI temporarily rate-limited/overloaded, falling back.");
    } else {
      console.error("generateHealthReport (patient) failed:", err);
    }
    return null;
  });

  if (!report) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#7488AA] flex items-center gap-1.5">
          <Sparkles size={12} /> The AI summary is unavailable right now. Showing the rule-based insights instead.
        </p>
        <AIInsightsPanel conflicts={conflicts} trends={trends} />
      </div>
    );
  }

  return <AiReportChat report={report} audience="patient" askAction={askPatientQuestion} />;
}
