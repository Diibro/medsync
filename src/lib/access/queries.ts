import "server-only";
import { db } from "@/lib/db";

export function listDoctorSessions(doctorId: string, take = 5) {
  return db.accessEvent.findMany({
    where: { doctorId },
    include: { patient: { select: { fullName: true, publicCode: true } } },
    orderBy: { startedAt: "desc" },
    take,
  });
}

export async function getDoctorStats(doctorId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [sessionsToday, totalSessions, flagged] = await Promise.all([
    db.accessEvent.count({ where: { doctorId, startedAt: { gte: startOfToday } } }),
    db.accessEvent.count({ where: { doctorId } }),
    db.accessEvent.count({ where: { doctorId, flaggedForReview: true } }),
  ]);

  return { sessionsToday, totalSessions, flagged };
}

export async function getPendingConsentRequests(patientId: string) {
  const codes = await db.consentCode.findMany({
    where: { patientId, consumedAt: null, expiresAt: { gt: new Date() } },
    include: { doctor: { include: { hospital: true } } },
    orderBy: { createdAt: "desc" },
  });

  return codes.map((c) => ({
    id: c.id,
    code: c.codeHash,
    doctorName: c.doctor.fullName,
    hospitalName: c.doctor.hospital.name,
    expiresAt: c.expiresAt,
  }));
}
