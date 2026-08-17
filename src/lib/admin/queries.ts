import "server-only";
import { db } from "@/lib/db";

export function listHospitalStaff(hospitalId: string) {
  return db.doctorProfile.findMany({ where: { hospitalId }, orderBy: { createdAt: "desc" } });
}

export function listHospitalAccessEvents(hospitalId: string) {
  return db.accessEvent.findMany({
    where: { doctor: { hospitalId } },
    include: { doctor: true, patient: { select: { fullName: true, publicCode: true } } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
}

export function listAllHospitals() {
  return db.hospital.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { doctors: true, externalIdentifiers: true, branches: true } },
      parentHospital: { select: { id: true, name: true } },
    },
  });
}

export function getHospitalDetail(hospitalId: string) {
  return db.hospital.findUnique({
    where: { id: hospitalId },
    include: {
      _count: { select: { doctors: true, externalIdentifiers: true } },
      parentHospital: { select: { id: true, name: true } },
      branches: { select: { id: true, name: true } },
      doctors: { orderBy: { createdAt: "desc" } },
    },
  });
}

export function listFlaggedAccessEvents() {
  return db.accessEvent.findMany({
    where: { flaggedForReview: true },
    include: { doctor: { include: { hospital: true } }, patient: { select: { fullName: true, publicCode: true } } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
}

export async function getPlatformStats() {
  const [patients, researchOptIn, records, accessEvents, flagged, hospitals, openMessages] = await Promise.all([
    db.patient.count(),
    db.patient.count({ where: { dataShareResearch: true } }),
    db.medicalRecord.count(),
    db.accessEvent.count(),
    db.accessEvent.count({ where: { flaggedForReview: true } }),
    db.hospital.count(),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);
  return { patients, researchOptIn, records, accessEvents, flagged, hospitals, openMessages };
}

export async function getHospitalStats(hospitalId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [doctorCount, sessionsToday, totalSessions, flagged] = await Promise.all([
    db.doctorProfile.count({ where: { hospitalId } }),
    db.accessEvent.count({ where: { doctor: { hospitalId }, startedAt: { gte: startOfToday } } }),
    db.accessEvent.count({ where: { doctor: { hospitalId } } }),
    db.accessEvent.count({ where: { doctor: { hospitalId }, flaggedForReview: true } }),
  ]);
  return { doctorCount, sessionsToday, totalSessions, flagged };
}

export function listAuditLogs(limit = 100) {
  return db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export function listContactMessages() {
  return db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}
