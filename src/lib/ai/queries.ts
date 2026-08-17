import "server-only";
import { db } from "@/lib/db";
import { computeConflicts, computeTrends, type Conflict, type TrendCard } from "@/lib/ai/rules";
import type { ObservationType } from "@/generated/prisma/enums";

const OBSERVATION_TYPES: ObservationType[] = ["BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BMI", "CHOLESTEROL"];

export async function getPatientInsights(patientId: string): Promise<{ conflicts: Conflict[]; trends: TrendCard[] }> {
  const [patient, prescriptions, observations] = await Promise.all([
    db.patient.findUniqueOrThrow({ where: { id: patientId }, select: { allergies: true } }),
    db.medicalRecord.findMany({ where: { patientId, type: "PRESCRIPTION" }, select: { title: true } }),
    db.observation.findMany({ where: { patientId }, orderBy: { recordedAt: "desc" } }),
  ]);

  const byType = Object.fromEntries(
    OBSERVATION_TYPES.map((type) => [
      type,
      observations
        .filter((o) => o.type === type)
        .slice(0, 2)
        .map((o) => ({ value: o.value, unit: o.unit, note: o.note, recordedAt: o.recordedAt })),
    ])
  ) as Record<ObservationType, { value: number; unit: string; note: string | null; recordedAt: Date }[]>;

  return {
    conflicts: computeConflicts(prescriptions.map((p) => p.title), patient.allergies),
    trends: computeTrends(byType),
  };
}
