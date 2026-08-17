"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireDoctor, requirePatient } from "@/lib/auth/guard";
import { requireActiveAccessGrant } from "@/lib/access/guard";
import { verifySecret } from "@/lib/auth/password";
import { generateNumericCode } from "@/lib/identity/public-code";
import { writeAudit } from "@/lib/audit/log";
import { checkNewPrescription, type Conflict } from "@/lib/ai/rules";
import { vitalsSchema, VITALS_CONFIG } from "@/lib/ai/vitals";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { pushRecordToHospital } from "@/lib/hospitals/connector";
import type { RecordType } from "@/generated/prisma/enums";

export type FormState = { error?: string } | undefined;
export type ClinicalEntryState = { error?: string; conflicts?: Conflict[] } | undefined;

const CONSENT_CODE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 10 * 60 * 1000;

const startSchema = z.object({ publicCode: z.string().trim().toUpperCase().min(1, "Enter the patient's code.") });

export async function startConsentRequest(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { doctor } = await requireDoctor();
  const parsed = startSchema.safeParse({ publicCode: formData.get("publicCode") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the patient's code." };
  }

  const patient = await db.patient.findUnique({ where: { publicCode: parsed.data.publicCode } });
  if (!patient) {
    return { error: "No patient found with that code." };
  }

  const code = generateNumericCode();
  const consentCode = await db.consentCode.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      codeHash: code, // plaintext by design — see docs/PROGRESS.md decisions log
      expiresAt: new Date(Date.now() + CONSENT_CODE_TTL_MS),
    },
  });

  await writeAudit({
    actorId: doctor.id,
    actorRole: "DOCTOR",
    action: "access.consent_code.requested",
    targetId: consentCode.id,
    metadata: { patientId: patient.id },
  });

  redirect(`/doctor/access/${consentCode.id}`);
}

const verifyCodeSchema = z.object({ code: z.string().trim().length(6, "Enter the 6-digit code.") });

export async function verifyConsentCode(consentCodeId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { doctor } = await requireDoctor();
  const parsed = verifyCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code." };
  }

  const rateLimit = checkRateLimit(`consent-code:${consentCodeId}`, { max: 5, windowMs: 5 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return { error: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds}s.` };
  }

  const consentCode = await db.consentCode.findUnique({ where: { id: consentCodeId } });
  if (!consentCode || consentCode.doctorId !== doctor.id) {
    return { error: "This request is no longer valid." };
  }
  if (consentCode.expiresAt.getTime() <= Date.now()) {
    return { error: "This code has expired. Start a new request." };
  }
  if (consentCode.codeHash !== parsed.data.code) {
    await writeAudit({
      actorId: doctor.id,
      actorRole: "DOCTOR",
      action: "access.consent_code.failed",
      targetId: consentCode.id,
    });
    return { error: "Incorrect code. Please try again." };
  }

  await db.consentCode.update({ where: { id: consentCode.id }, data: { consumedAt: new Date() } });
  await writeAudit({
    actorId: doctor.id,
    actorRole: "DOCTOR",
    action: "access.consent_code.verified",
    targetId: consentCode.id,
  });

  // The doctor is already signed in to their own MedSync account (that's the identity check) — the
  // consent code is the patient's proof of presence/consent, so the session starts right away with
  // no separate PIN step. A PIN is still required for Emergency Override below, since that path
  // skips patient consent entirely and needs its own check. See docs/PROGRESS.md decisions log.
  const grant = await createSessionForPatient(doctor.id, consentCode.patientId, "CONSENT_CODE");
  redirect(`/doctor/session/${grant.id}`);
}

async function createSessionForPatient(doctorId: string, patientId: string, method: "CONSENT_CODE" | "EMERGENCY_OVERRIDE") {
  const grant = await db.accessEvent.create({
    data: {
      patientId,
      doctorId,
      method,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      flaggedForReview: method === "EMERGENCY_OVERRIDE",
    },
  });
  await writeAudit({
    actorId: doctorId,
    actorRole: "DOCTOR",
    action: method === "EMERGENCY_OVERRIDE" ? "access.emergency_override" : "access.session_started",
    targetId: grant.id,
    metadata: { patientId },
  });
  return grant;
}

const overrideSchema = z.object({
  publicCode: z.string().trim().toUpperCase().min(1, "Enter the patient's code."),
  pin: z.string().trim().length(4, "Enter your 4-digit PIN."),
});

export async function startEmergencyOverride(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { doctor } = await requireDoctor();
  const parsed = overrideSchema.safeParse({
    publicCode: formData.get("publicCode"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const patient = await db.patient.findUnique({ where: { publicCode: parsed.data.publicCode } });
  if (!patient) {
    return { error: "No patient found with that code." };
  }

  const rateLimit = checkRateLimit(`pin:${doctor.id}`, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return { error: `Too many attempts. Try again in ${rateLimit.retryAfterSeconds}s.` };
  }

  const validPin = await verifySecret(parsed.data.pin, doctor.pinHash);
  if (!validPin) {
    return { error: "Incorrect PIN." };
  }

  const grant = await createSessionForPatient(doctor.id, patient.id, "EMERGENCY_OVERRIDE");
  redirect(`/doctor/session/${grant.id}`);
}

export async function denyConsentRequest(consentCodeId: string) {
  const { patient } = await requirePatient();
  const consentCode = await db.consentCode.findUnique({ where: { id: consentCodeId } });
  if (!consentCode || consentCode.patientId !== patient.id) return;

  await db.consentCode.update({ where: { id: consentCodeId }, data: { expiresAt: new Date() } });
  await writeAudit({
    actorId: patient.id,
    actorRole: "PATIENT",
    action: "access.consent_code.denied",
    targetId: consentCodeId,
  });
  revalidatePath("/dashboard");
}

export async function endAccessEvent(accessEventId: string) {
  const { doctor } = await requireDoctor();
  const grant = await db.accessEvent.findUnique({ where: { id: accessEventId } });

  if (grant && grant.doctorId === doctor.id && grant.status === "ACTIVE") {
    await db.accessEvent.update({ where: { id: grant.id }, data: { status: "ENDED", endedAt: new Date() } });
    await writeAudit({ actorId: doctor.id, actorRole: "DOCTOR", action: "access.session_ended", targetId: grant.id });
  }
  redirect("/doctor");
}

export async function markRecordsViewed(accessEventId: string, recordIds: string[]) {
  const { grant } = await requireActiveAccessGrant(accessEventId);
  const merged = Array.from(new Set([...grant.recordsViewed, ...recordIds]));
  await db.accessEvent.update({ where: { id: grant.id }, data: { recordsViewed: merged } });
}

const clinicalEntrySchema = z.object({
  type: z.enum(["DIAGNOSIS", "PRESCRIPTION", "LAB_REPORT", "PROCEDURE", "VACCINATION"]),
  title: z.string().trim().min(2, "Enter a title."),
  description: z.string().trim().optional(),
  dosage: z.string().trim().optional(),
  duration: z.string().trim().optional(),
});

export async function addClinicalEntry(accessEventId: string, _prevState: ClinicalEntryState, formData: FormData): Promise<ClinicalEntryState> {
  const { doctor, grant } = await requireActiveAccessGrant(accessEventId);

  const parsed = clinicalEntrySchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dosage: formData.get("dosage") || undefined,
    duration: formData.get("duration") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  let conflicts: Conflict[] = [];
  if (parsed.data.type === "PRESCRIPTION") {
    const [existing, patient] = await Promise.all([
      db.medicalRecord.findMany({ where: { patientId: grant.patientId, type: "PRESCRIPTION" }, select: { title: true } }),
      db.patient.findUniqueOrThrow({ where: { id: grant.patientId }, select: { allergies: true } }),
    ]);
    conflicts = checkNewPrescription(parsed.data.title, existing.map((e) => e.title), patient.allergies);
    if (conflicts.length > 0) {
      await db.aiInsight.create({
        data: { patientId: grant.patientId, kind: "DRUG_CONFLICT", severity: conflicts[0].severity, payload: conflicts },
      });
      await writeAudit({
        actorId: doctor.id,
        actorRole: "DOCTOR",
        action: "ai.drug_conflict.flagged",
        targetId: grant.patientId,
        metadata: { conflicts },
      });
    }
  }

  const record = await db.medicalRecord.create({
    data: {
      patientId: grant.patientId,
      type: parsed.data.type as RecordType,
      source: "DOCTOR_MANUAL",
      title: parsed.data.title,
      description: parsed.data.description,
      dosage: parsed.data.dosage,
      duration: parsed.data.duration,
      doctorName: doctor.fullName,
      authoredByDoctorId: doctor.id,
      hospitalId: doctor.hospitalId,
      occurredAt: new Date(),
      tags: [],
    },
  });

  await db.accessEvent.update({
    where: { id: grant.id },
    data: { recordsViewed: Array.from(new Set([...grant.recordsViewed, record.id])) },
  });
  await writeAudit({
    actorId: doctor.id,
    actorRole: "DOCTOR",
    action: "record.doctor_entry.created",
    targetId: record.id,
    metadata: { accessEventId: grant.id },
  });

  // Best-effort write-back to the hospital's own system, if the patient is linked to it. Never
  // blocks or fails the doctor's save — see lib/hospitals/connector.ts and docs/ARCHITECTURE.md §7.
  const link = await db.externalIdentifier.findUnique({
    where: { hospitalId_patientId: { hospitalId: doctor.hospitalId, patientId: grant.patientId } },
  });
  if (link && doctor.hospital.baseUrl && doctor.hospital.syncEnabled) {
    const result = await pushRecordToHospital(
      doctor.hospital.baseUrl,
      link.externalId,
      {
        type: parsed.data.type as RecordType,
        title: parsed.data.title,
        description: parsed.data.description,
        doctorName: doctor.fullName,
        occurredAt: record.occurredAt.toISOString().slice(0, 10),
        dosage: parsed.data.dosage,
        duration: parsed.data.duration,
      },
      doctor.hospital.apiKey
    );
    await writeAudit({
      actorId: doctor.id,
      actorRole: "DOCTOR",
      action: result.ok ? "hospital.write_back.succeeded" : "hospital.write_back.failed",
      targetId: record.id,
      metadata: result.ok ? undefined : { error: result.error },
    });
  }

  revalidatePath(`/doctor/session/${accessEventId}`);
  return { error: undefined, conflicts: conflicts.length > 0 ? conflicts : undefined };
}

export async function recordVitalsDuringSession(accessEventId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { grant } = await requireActiveAccessGrant(accessEventId);
  const parsed = vitalsSchema.safeParse({
    type: formData.get("type"),
    value: formData.get("value"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  await db.observation.create({
    data: {
      patientId: grant.patientId,
      type: parsed.data.type,
      value: parsed.data.value,
      unit: VITALS_CONFIG[parsed.data.type].unit,
      note: parsed.data.note,
    },
  });

  revalidatePath(`/doctor/session/${accessEventId}`);
  return { error: undefined };
}
