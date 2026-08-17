"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePatient } from "@/lib/auth/guard";
import { writeAudit } from "@/lib/audit/log";
import { saveUpload } from "@/lib/records/storage";
import { vitalsSchema, VITALS_CONFIG } from "@/lib/ai/vitals";
import { isOcrConfigured, isOcrSupportedMimeType, extractRecordDraft, type OcrDraft } from "@/lib/ai/ocr";
import type { RecordType } from "@/generated/prisma/enums";

export type FormState = { error?: string; success?: string } | undefined;
export type UploadState = { error?: string; success?: string; documentId?: string; draft?: OcrDraft } | undefined;

const documentTypeToRecordType: Record<string, RecordType> = {
  lab: "LAB_REPORT",
  scan: "LAB_REPORT",
  prescription: "PRESCRIPTION",
  discharge: "PROCEDURE",
  referral: "PROCEDURE",
  other: "LAB_REPORT",
};

const uploadSchema = z.object({
  documentType: z.string().trim().min(1, "Select a document type."),
  occurredAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid document date."),
  note: z.string().trim().optional(),
});

function fallbackTitle(documentType: string, fileName: string) {
  return `${documentType} — ${fileName}`;
}

async function createFallbackRecord(patientId: string, document: { id: string; documentType: string; fileName: string; note: string | null }, occurredAt: Date) {
  return db.medicalRecord.create({
    data: {
      patientId,
      type: documentTypeToRecordType[document.documentType] ?? "LAB_REPORT",
      source: "PATIENT_MANUAL",
      title: fallbackTitle(document.documentType, document.fileName),
      description: document.note ?? undefined,
      documentId: document.id,
      occurredAt,
      tags: ["Uploaded document"],
    },
  });
}

export async function uploadDocument(_prevState: UploadState, formData: FormData): Promise<UploadState> {
  const { patient } = await requirePatient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "File is larger than the 20MB limit." };
  }

  const parsed = uploadSchema.safeParse({
    documentType: formData.get("documentType"),
    occurredAt: formData.get("occurredAt"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveUpload(patient.id, file.name, buffer);
  const mimeType = file.type || "application/octet-stream";

  const document = await db.document.create({
    data: {
      patientId: patient.id,
      fileName: file.name,
      storageKey,
      mimeType,
      sizeBytes: file.size,
      documentType: parsed.data.documentType,
      note: parsed.data.note,
    },
  });
  await writeAudit({ actorId: patient.id, actorRole: "PATIENT", action: "record.document.uploaded", targetId: document.id });

  const occurredAt = new Date(parsed.data.occurredAt);

  if (!isOcrConfigured() || !isOcrSupportedMimeType(mimeType)) {
    await db.ocrJob.create({ data: { documentId: document.id, status: "NOT_CONFIGURED" } });
    await createFallbackRecord(patient.id, document, occurredAt);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/records");
    return { success: "Document uploaded." };
  }

  try {
    const draft = await extractRecordDraft(buffer, mimeType);
    await db.ocrJob.create({
      data: { documentId: document.id, status: "COMPLETED", draft, completedAt: new Date() },
    });
    // No MedicalRecord yet — the UI shows this draft for the patient to confirm or edit first.
    return { documentId: document.id, draft };
  } catch (err) {
    await db.ocrJob.create({
      data: { documentId: document.id, status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
    });
    await createFallbackRecord(patient.id, document, occurredAt);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/records");
    return { success: "Document uploaded (automatic extraction failed, so it was saved as-is)." };
  }
}

const confirmDraftSchema = z.object({
  type: z.enum(["DIAGNOSIS", "PRESCRIPTION", "LAB_REPORT", "PROCEDURE", "VACCINATION"]),
  title: z.string().trim().min(2, "Enter a title."),
  description: z.string().trim().optional(),
  doctorName: z.string().trim().optional(),
  occurredAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date."),
  tags: z.string().trim().optional(),
});

export async function confirmOcrDraft(documentId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { patient } = await requirePatient();
  const document = await db.document.findUnique({ where: { id: documentId }, include: { medicalRecord: true } });
  if (!document || document.patientId !== patient.id) {
    return { error: "Document not found." };
  }
  if (document.medicalRecord) {
    return { success: "Already saved." };
  }

  const parsed = confirmDraftSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    doctorName: formData.get("doctorName") || undefined,
    occurredAt: formData.get("occurredAt"),
    tags: formData.get("tags") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const tags = parsed.data.tags ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await db.medicalRecord.create({
    data: {
      patientId: patient.id,
      type: parsed.data.type as RecordType,
      source: "PATIENT_MANUAL",
      title: parsed.data.title,
      description: parsed.data.description,
      doctorName: parsed.data.doctorName,
      documentId: document.id,
      occurredAt: new Date(parsed.data.occurredAt),
      tags: [...tags, "OCR-assisted"],
    },
  });
  await writeAudit({ actorId: patient.id, actorRole: "PATIENT", action: "record.ocr_draft.confirmed", targetId: document.id });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/records");
  return { success: "Saved to your record." };
}

export async function discardOcrDraft(documentId: string): Promise<FormState> {
  const { patient } = await requirePatient();
  const document = await db.document.findUnique({ where: { id: documentId }, include: { medicalRecord: true } });
  if (!document || document.patientId !== patient.id || document.medicalRecord) {
    return undefined;
  }

  await createFallbackRecord(patient.id, document, new Date());
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/records");
  return { success: "Saved without the extracted details." };
}

export async function recordVitals(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { patient } = await requirePatient();
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
      patientId: patient.id,
      type: parsed.data.type,
      value: parsed.data.value,
      unit: VITALS_CONFIG[parsed.data.type].unit,
      note: parsed.data.note,
    },
  });

  revalidatePath("/dashboard/insights");
  return { success: "Vitals recorded." };
}
