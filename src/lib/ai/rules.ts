import "server-only";
import { VITALS_CONFIG } from "@/lib/ai/vitals";
import type { ObservationType } from "@/generated/prisma/enums";

export type ConflictSeverity = "high" | "moderate";

export type Conflict = {
  severity: ConflictSeverity;
  drugs: string[];
  warning: string;
};

// A small, illustrative interaction table — not a substitute for a real drug database (e.g.
// First Databank / RxNorm). Matching is a case-insensitive substring test against prescription
// titles, so "Warfarin 5mg" matches "warfarin". See docs/PROGRESS.md decisions log.
const INTERACTIONS: { a: string; b: string; severity: ConflictSeverity; warning: string }[] = [
  { a: "warfarin", b: "aspirin", severity: "high", warning: "Increased bleeding risk. Avoid concurrent use without hematologist supervision." },
  { a: "warfarin", b: "ibuprofen", severity: "high", warning: "NSAID + anticoagulant combination increases GI and systemic bleeding risk." },
  { a: "metformin", b: "contrast", severity: "moderate", warning: "Hold Metformin 48hrs before any imaging with contrast media (lactic acidosis risk)." },
  { a: "sildenafil", b: "nitrate", severity: "high", warning: "Combination can cause severe, potentially fatal hypotension." },
  { a: "lisinopril", b: "potassium", severity: "moderate", warning: "ACE inhibitor + potassium supplementation raises hyperkalemia risk." },
  { a: "simvastatin", b: "clarithromycin", severity: "moderate", warning: "Increased risk of statin-associated myopathy/rhabdomyolysis." },
];

function normalize(title: string) {
  return title.toLowerCase();
}

export function computeConflicts(activePrescriptionTitles: string[], allergies: string[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const titles = activePrescriptionTitles.map((t) => ({ raw: t, norm: normalize(t) }));

  for (const allergy of allergies) {
    const allergyNorm = normalize(allergy);
    for (const t of titles) {
      if (t.norm.includes(allergyNorm)) {
        conflicts.push({
          severity: "high",
          drugs: [t.raw, `Allergy: ${allergy}`],
          warning: `Patient has a recorded allergy to ${allergy}. Verify before administering ${t.raw}.`,
        });
      }
    }
  }

  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      for (const rule of INTERACTIONS) {
        const aMatch = titles[i].norm.includes(rule.a) || titles[j].norm.includes(rule.a);
        const bMatch = titles[i].norm.includes(rule.b) || titles[j].norm.includes(rule.b);
        if (aMatch && bMatch) {
          conflicts.push({ severity: rule.severity, drugs: [titles[i].raw, titles[j].raw], warning: rule.warning });
        }
      }
    }
  }

  return conflicts;
}

/** Checks one proposed new prescription against the patient's existing active prescriptions + allergies. */
export function checkNewPrescription(newTitle: string, existingTitles: string[], allergies: string[]): Conflict[] {
  return computeConflicts([newTitle, ...existingTitles], allergies).filter((c) => c.drugs.includes(newTitle));
}

export type TrendDirection = "up" | "down" | "stable";

export type TrendCard = {
  type: ObservationType;
  label: string;
  value: string;
  direction: TrendDirection;
  note: string;
};

export function computeTrends(
  observationsByType: Record<ObservationType, { value: number; unit: string; note: string | null; recordedAt: Date }[]>
): TrendCard[] {
  const cards: TrendCard[] = [];

  for (const type of Object.keys(observationsByType) as ObservationType[]) {
    const readings = observationsByType[type];
    if (!readings || readings.length === 0) continue;

    const [latest, previous] = readings;
    const config = VITALS_CONFIG[type];
    const display = latest.note?.trim() || `${latest.value} ${latest.unit}`;

    let direction: TrendDirection = "stable";
    let note = `Recorded ${latest.recordedAt.toLocaleDateString()}.`;
    if (previous) {
      const delta = latest.value - previous.value;
      const pct = previous.value !== 0 ? Math.abs((delta / previous.value) * 100) : 0;
      if (Math.abs(delta) < 0.01) {
        direction = "stable";
        note = "Stable since last reading.";
      } else {
        direction = delta > 0 ? "up" : "down";
        note = `${delta > 0 ? "Up" : "Down"} ${pct.toFixed(0)}% since ${previous.recordedAt.toLocaleDateString()}.`;
      }
    }

    cards.push({ type, label: config.label, value: display, direction, note });
  }

  return cards;
}
