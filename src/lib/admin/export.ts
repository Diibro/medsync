import "server-only";
import { db } from "@/lib/db";

// De-identified aggregate export — only patients who opted into `dataShareResearch` are included,
// and only as counts/buckets, never as individually identifiable rows (no name, email, phone, or
// patient id). See docs/PRODUCT.md §3 and docs/ARCHITECTURE.md §3.
export async function buildResearchExport() {
  const consentingPatients = await db.patient.findMany({
    where: { dataShareResearch: true },
    select: { dateOfBirth: true, bloodGroup: true, allergies: true },
  });

  const ageBuckets: Record<string, number> = {};
  const now = new Date();
  for (const p of consentingPatients) {
    const age = Math.floor((now.getTime() - p.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const bucket = `${Math.floor(age / 10) * 10}s`;
    ageBuckets[bucket] = (ageBuckets[bucket] ?? 0) + 1;
  }

  const bloodGroupCounts: Record<string, number> = {};
  for (const p of consentingPatients) {
    const key = p.bloodGroup ?? "unknown";
    bloodGroupCounts[key] = (bloodGroupCounts[key] ?? 0) + 1;
  }

  const allergyCounts: Record<string, number> = {};
  for (const p of consentingPatients) {
    for (const a of p.allergies) {
      allergyCounts[a] = (allergyCounts[a] ?? 0) + 1;
    }
  }

  const recordsByType = await db.medicalRecord.groupBy({
    by: ["type"],
    where: { patient: { dataShareResearch: true } },
    _count: true,
  });

  return {
    generatedAt: new Date().toISOString(),
    consentingPatientCount: consentingPatients.length,
    ageBuckets,
    bloodGroupCounts,
    allergyCounts,
    recordsByType: Object.fromEntries(recordsByType.map((r) => [r.type, r._count])),
  };
}
