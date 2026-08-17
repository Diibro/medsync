"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePatient } from "@/lib/auth/guard";
import { writeAudit } from "@/lib/audit/log";
import { fetchPatientBundle, HospitalConnectorError, type RemotePatientBundle } from "@/lib/hospitals/connector";

export type FormState = { error?: string; success?: string } | undefined;

function insertRecordsFromBundle(patientId: string, hospitalId: string, bundle: RemotePatientBundle) {
  return db.$transaction(async (tx) => {
    let created = 0;
    for (const record of bundle.records) {
      const externalRecordRef = `${hospitalId}:${bundle.externalId}:${record.title}:${record.occurredAt}`;
      const existing = await tx.medicalRecord.findFirst({
        where: { patientId, hospitalId, externalRecordRef },
      });
      if (existing) continue;

      await tx.medicalRecord.create({
        data: {
          patientId,
          hospitalId,
          type: record.type,
          source: "HOSPITAL_SYNC",
          title: record.title,
          description: record.description,
          doctorName: record.doctorName,
          dosage: record.dosage,
          duration: record.duration,
          tags: record.tags ?? [],
          occurredAt: new Date(record.occurredAt),
          externalRecordRef,
        },
      });
      created++;
    }
    return created;
  });
}

async function fetchBundleOrThrow(hospitalId: string, externalId: string) {
  const hospital = await db.hospital.findUniqueOrThrow({ where: { id: hospitalId } });
  if (!hospital.baseUrl) {
    throw new HospitalConnectorError("This hospital has no connection configured yet.");
  }
  if (!hospital.syncEnabled) {
    throw new HospitalConnectorError("This hospital's connection is currently paused by their admin.");
  }
  return fetchPatientBundle(hospital.baseUrl, externalId, hospital.apiKey);
}

const linkSchema = z.object({
  hospitalId: z.string().min(1, "Choose a hospital."),
  externalId: z.string().trim().min(1, "Enter your patient ID at that hospital."),
});

export async function linkHospital(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { patient } = await requirePatient();
  const parsed = linkSchema.safeParse({
    hospitalId: formData.get("hospitalId"),
    externalId: formData.get("externalId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await db.externalIdentifier.findUnique({
    where: { hospitalId_patientId: { hospitalId: parsed.data.hospitalId, patientId: patient.id } },
  });
  if (existing) {
    return { error: "You've already linked this hospital." };
  }

  // Confirm the hospital actually has a record for this patient ID before creating anything — a
  // link should never exist without a verified match on the other end.
  let bundle;
  try {
    bundle = await fetchBundleOrThrow(parsed.data.hospitalId, parsed.data.externalId);
  } catch (err) {
    return { error: err instanceof HospitalConnectorError ? err.message : "Could not verify that patient ID. Try again." };
  }

  let link;
  try {
    link = await db.externalIdentifier.create({
      data: {
        patientId: patient.id,
        hospitalId: parsed.data.hospitalId,
        externalId: parsed.data.externalId,
        lastSyncedAt: new Date(),
      },
    });
  } catch {
    return { error: "That patient ID is already linked to a different MedSync account." };
  }

  const created = await insertRecordsFromBundle(patient.id, parsed.data.hospitalId, bundle);

  await writeAudit({
    actorId: patient.id,
    actorRole: "PATIENT",
    action: "hospital.linked",
    targetId: link.id,
    metadata: { hospitalId: parsed.data.hospitalId, recordsCreated: created },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/records");
  return { success: `Hospital linked — ${created} record${created === 1 ? "" : "s"} pulled in.` };
}

export async function resyncHospital(externalIdentifierId: string) {
  const { patient } = await requirePatient();
  const link = await db.externalIdentifier.findUnique({ where: { id: externalIdentifierId } });
  if (!link || link.patientId !== patient.id) return;

  try {
    const bundle = await fetchBundleOrThrow(link.hospitalId, link.externalId);
    const created = await insertRecordsFromBundle(patient.id, link.hospitalId, bundle);
    await db.externalIdentifier.update({
      where: { id: link.id },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });
    await writeAudit({
      actorId: patient.id,
      actorRole: "PATIENT",
      action: "hospital.synced",
      targetId: externalIdentifierId,
      metadata: { recordsCreated: created },
    });
  } catch (err) {
    const message = err instanceof HospitalConnectorError ? err.message : "Sync failed unexpectedly.";
    await db.externalIdentifier.update({ where: { id: externalIdentifierId }, data: { lastSyncError: message } });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/records");
}
