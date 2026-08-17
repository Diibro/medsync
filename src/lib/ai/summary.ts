import "server-only";
import { createHash } from "node:crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { Conflict, TrendCard } from "@/lib/ai/rules";

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** True for rate-limit/overload responses (429/503) — expected, routine on a free-tier key, not a
 * bug. Callers should log these quietly and fall back, not alarm on them like a real failure. */
export function isTransientAiError(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status;
  return status === 429 || status === 503;
}

const reportSchema = z.object({
  summary: z.string(),
  criticalConditions: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type HealthReport = z.infer<typeof reportSchema>;

const REPORT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "2-4 sentence narrative summary" },
    criticalConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary", "criticalConditions", "warnings"],
};

export type PatientContext = {
  fullName: string;
  ageYears: number | null;
  bloodGroup: string | null;
  genotype: string | null;
  allergies: string[];
  records: {
    type: string;
    title: string;
    description: string | null;
    doctorName: string | null;
    occurredAt: string;
    dosage: string | null;
    duration: string | null;
    hospitalName: string | null;
  }[];
  observations: { type: string; value: number; unit: string; note: string | null; recordedAt: string }[];
  conflicts: Conflict[];
  trends: TrendCard[];
};

export function formatPatientContext(ctx: PatientContext): string {
  const lines: string[] = [];
  lines.push(`Patient: ${ctx.fullName}${ctx.ageYears != null ? `, ${ctx.ageYears} years old` : ""}`);
  lines.push(`Blood group: ${ctx.bloodGroup ?? "not recorded"}. Genotype: ${ctx.genotype ?? "not recorded"}.`);
  lines.push(`Known allergies: ${ctx.allergies.length ? ctx.allergies.join(", ") : "none recorded"}.`);

  if (ctx.records.length === 0) {
    lines.push("Medical records: NONE on file.");
  } else {
    lines.push(`Medical records (${ctx.records.length}):`);
    for (const r of ctx.records) {
      const parts = [`- [${r.type}] ${r.title} (${r.occurredAt})`];
      if (r.description) parts.push(`  Notes: ${r.description}`);
      if (r.dosage) parts.push(`  Dosage: ${r.dosage}${r.duration ? `, ${r.duration}` : ""}`);
      if (r.doctorName) parts.push(`  By: ${r.doctorName}`);
      if (r.hospitalName) parts.push(`  At: ${r.hospitalName}`);
      lines.push(parts.join("\n"));
    }
  }

  if (ctx.observations.length > 0) {
    lines.push("Recent vitals:");
    for (const o of ctx.observations) {
      lines.push(`- ${o.type}: ${o.note?.trim() || `${o.value} ${o.unit}`} (${o.recordedAt})`);
    }
  }

  if (ctx.conflicts.length > 0) {
    lines.push("CONFIRMED conflicts already detected by the system's rule engine (authoritative, do not contradict):");
    for (const c of ctx.conflicts) {
      lines.push(`- [${c.severity}] ${c.drugs.join(" + ")}: ${c.warning}`);
    }
  }

  if (ctx.trends.length > 0) {
    lines.push("Vitals trends already computed (authoritative):");
    for (const t of ctx.trends) {
      lines.push(`- ${t.label}: ${t.value} (${t.direction}) — ${t.note}`);
    }
  }

  return lines.join("\n");
}

const DOCTOR_INSTRUCTIONS = `You are a clinical summary assistant inside a hospital patient-record system, writing for the
treating doctor who just opened this patient's chart. Your job is to report facts, not to practice
medicine: never instruct the doctor what treatment, test, or medication to give. Summarize the
patient's history clearly, and separately call out any critical conditions (allergies, chronic
conditions, confirmed drug conflicts) and things to avoid or double-check. If a "CONFIRMED
conflicts" section is present in the data, always surface those in your warnings — never contradict
or soften them. If there are no medical records at all, say so plainly in the summary and use the
warnings list for general, non-patient-specific clinical safety best practices instead (e.g.
"confirm allergy status before prescribing" — nothing invented about this specific patient).`;

const PATIENT_INSTRUCTIONS = `You are explaining a patient's own health record back to them, directly, in simple everyday
English — avoid medical jargon, or briefly explain any term you must use. Be warm and reassuring,
not alarming. Summarize what's in their record in plain language, and separately list anything they
should know to be careful about (allergies, conditions, interactions). Never give instructions like
"take X" or "stop Y" — only describe what's on file and what to be mindful of, and suggest they
raise anything important with their doctor. If there are no medical records at all, say so kindly
and use the warnings list for general, friendly health and safety tips instead.`;

async function callGemini(systemInstruction: string, prompt: string) {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: REPORT_RESPONSE_SCHEMA,
      maxOutputTokens: 1024,
    },
  });
  if (!response.text) throw new Error("Empty AI response.");
  return reportSchema.parse(JSON.parse(response.text));
}

// In-memory cache keyed by audience + a hash of the exact formatted context — so it invalidates
// itself automatically the moment anything about the patient's records/vitals/conflicts changes,
// with no explicit invalidation wiring needed at every record-mutating call site. The TTL is just a
// memory/staleness backstop, not the primary invalidation mechanism. Every page visit to Insights
// (or every new doctor session) was re-generating an identical report from scratch — this is the
// single biggest lever on free-tier quota usage, see docs/PROGRESS.md.
const REPORT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const reportCache = new Map<string, { report: HealthReport; expiresAt: number }>();

function reportCacheKey(audience: "doctor" | "patient", formattedContext: string): string {
  const hash = createHash("sha256").update(formattedContext).digest("hex").slice(0, 32);
  return `${audience}:${hash}`;
}

export async function generateHealthReport(ctx: PatientContext, audience: "doctor" | "patient"): Promise<HealthReport> {
  const formatted = formatPatientContext(ctx);
  const key = reportCacheKey(audience, formatted);

  const cached = reportCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.report;
  }

  const instructions = audience === "doctor" ? DOCTOR_INSTRUCTIONS : PATIENT_INSTRUCTIONS;
  const report = await callGemini(instructions, formatted);
  reportCache.set(key, { report, expiresAt: Date.now() + REPORT_CACHE_TTL_MS });
  return report;
}
