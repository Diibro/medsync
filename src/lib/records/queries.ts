import "server-only";
import { db } from "@/lib/db";
import type { RecordType } from "@/generated/prisma/enums";

export function listPatientRecords(patientId: string, type?: RecordType) {
  return db.medicalRecord.findMany({
    where: { patientId, ...(type ? { type } : {}) },
    include: { hospital: true, document: true },
    orderBy: { occurredAt: "desc" },
  });
}

export async function getOverviewStats(patientId: string) {
  const [totalRecords, prescriptions, doctorAuthored, accessEvents] = await Promise.all([
    db.medicalRecord.count({ where: { patientId } }),
    db.medicalRecord.count({ where: { patientId, type: "PRESCRIPTION" } }),
    db.medicalRecord.findMany({
      where: { patientId, doctorName: { not: null } },
      orderBy: { occurredAt: "desc" },
      take: 1,
      select: { occurredAt: true },
    }),
    db.accessEvent.findMany({
      where: { patientId },
      orderBy: { startedAt: "desc" },
      take: 1,
      select: { startedAt: true },
    }),
  ]);

  const doctorVisitCount = await db.medicalRecord.count({
    where: { patientId, doctorName: { not: null } },
  });
  const accessEventCount = await db.accessEvent.count({ where: { patientId } });

  return {
    totalRecords,
    prescriptions,
    doctorVisitCount,
    lastDoctorVisit: doctorAuthored[0]?.occurredAt ?? null,
    accessEventCount,
    lastAccessEvent: accessEvents[0]?.startedAt ?? null,
  };
}
