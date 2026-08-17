import "server-only";
import { db } from "@/lib/db";
import { computeConflicts, computeTrends } from "@/lib/ai/rules";
import type { PatientContext } from "@/lib/ai/summary";
import type { ObservationType } from "@/generated/prisma/enums";

const OBSERVATION_TYPES: ObservationType[] = ["BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BMI", "CHOLESTEROL"];

function ageFromDob(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const diff = Date.now() - dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function buildPatientContext(patientId: string): Promise<PatientContext> {
  const [patient, records, observations] = await Promise.all([
    db.patient.findUniqueOrThrow({ where: { id: patientId } }),
    db.medicalRecord.findMany({
      where: { patientId },
      include: { hospital: true },
      orderBy: { occurredAt: "desc" },
    }),
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

  const prescriptionTitles = records.filter((r) => r.type === "PRESCRIPTION").map((r) => r.title);

  return {
    fullName: patient.fullName,
    ageYears: ageFromDob(patient.dateOfBirth),
    bloodGroup: patient.bloodGroup,
    genotype: patient.genotype,
    allergies: patient.allergies,
    records: records.map((r) => ({
      type: r.type,
      title: r.title,
      description: r.description,
      doctorName: r.doctorName,
      occurredAt: r.occurredAt.toISOString().slice(0, 10),
      dosage: r.dosage,
      duration: r.duration,
      hospitalName: r.hospital?.name ?? null,
    })),
    observations: observations.slice(0, 8).map((o) => ({
      type: o.type,
      value: o.value,
      unit: o.unit,
      note: o.note,
      recordedAt: o.recordedAt.toISOString().slice(0, 10),
    })),
    conflicts: computeConflicts(prescriptionTitles, patient.allergies),
    trends: computeTrends(byType),
  };
}
