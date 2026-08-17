"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireHospitalAdmin, requirePlatformAdmin, requireRole } from "@/lib/auth/guard";
import { hashSecret } from "@/lib/auth/password";
import { writeAudit } from "@/lib/audit/log";

export type FormState = { error?: string; success?: string } | undefined;

const doctorSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the doctor's full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  licenseId: z.string().trim().min(2, "Enter a license or staff ID."),
  specialty: z.string().trim().optional(),
  pin: z.string().trim().length(4, "PIN must be exactly 4 digits."),
});

export async function createDoctorAccount(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { staff, hospital } = await requireHospitalAdmin();
  const parsed = doctorSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    licenseId: formData.get("licenseId"),
    specialty: formData.get("specialty") || undefined,
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashSecret(parsed.data.password);
  const pinHash = await hashSecret(parsed.data.pin);

  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: "DOCTOR",
      doctorProfile: {
        create: {
          fullName: parsed.data.fullName,
          hospitalId: hospital.id,
          licenseId: parsed.data.licenseId,
          specialty: parsed.data.specialty,
          pinHash,
        },
      },
    },
  });

  await writeAudit({
    actorId: staff.id,
    actorRole: "HOSPITAL_ADMIN",
    action: "admin.doctor.provisioned",
    targetId: user.id,
    metadata: { hospitalId: hospital.id },
  });

  revalidatePath("/admin/hospital");
  revalidatePath("/admin/hospital/staff");
  return { success: `Doctor account created for ${parsed.data.fullName}.` };
}

/** A hospital's own admin can manage only their hospital; a platform admin can manage any of them. */
async function requireHospitalManager(hospitalId?: string) {
  const session = await requireRole("HOSPITAL_ADMIN", "PLATFORM_STAFF", "PLATFORM_ADMIN");
  if (session.user.role === "HOSPITAL_ADMIN") {
    const { staff, hospital } = await requireHospitalAdmin();
    if (hospitalId && hospital.id !== hospitalId) redirect("/admin/hospital");
    return { session, actorRole: "HOSPITAL_ADMIN" as const, actorId: staff.id, hospitalId: hospital.id };
  }
  return { session, actorRole: "PLATFORM_ADMIN" as const, actorId: session.user.id, hospitalId };
}

const hospitalSchema = z.object({
  name: z.string().trim().min(2, "Enter a hospital name."),
  location: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  contactPhone: z.string().trim().optional(),
  baseUrl: z.string().trim().url("Enter a valid URL, e.g. http://localhost:5104").optional().or(z.literal("")),
  apiKey: z.string().trim().optional(),
  connectionNotes: z.string().trim().optional(),
  parentHospitalId: z.string().trim().optional(),
  agreementSignedAt: z.string().trim().optional(),
  agreementNotes: z.string().trim().optional(),
});

function parseHospitalForm(formData: FormData) {
  const parentHospitalId = formData.get("parentHospitalId");
  return hospitalSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
    contactEmail: formData.get("contactEmail") || "",
    contactPhone: formData.get("contactPhone") || undefined,
    baseUrl: formData.get("baseUrl") || "",
    apiKey: formData.get("apiKey") || undefined,
    connectionNotes: formData.get("connectionNotes") || undefined,
    parentHospitalId: parentHospitalId && parentHospitalId !== "none" ? parentHospitalId : undefined,
    agreementSignedAt: formData.get("agreementSignedAt") || undefined,
    agreementNotes: formData.get("agreementNotes") || undefined,
  });
}

export async function createHospital(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { staff } = await requirePlatformAdmin();
  const parsed = parseHospitalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const d = parsed.data;

  const hospital = await db.hospital.create({
    data: {
      name: d.name,
      location: d.location,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone,
      baseUrl: d.baseUrl || null,
      apiKey: d.apiKey,
      connectionNotes: d.connectionNotes,
      parentHospitalId: d.parentHospitalId || null,
      agreementSignedAt: d.agreementSignedAt ? new Date(d.agreementSignedAt) : null,
      agreementNotes: d.agreementNotes,
      isVerified: true,
    },
  });

  await writeAudit({
    actorId: staff.id,
    actorRole: "PLATFORM_ADMIN",
    action: "admin.hospital.onboarded",
    targetId: hospital.id,
  });

  revalidatePath("/admin/platform");
  revalidatePath("/admin/platform/hospitals");
  return { success: `${d.name} onboarded.` };
}

export async function updateHospital(hospitalId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { actorId, actorRole } = await requireHospitalManager(hospitalId);
  const parsed = parseHospitalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const d = parsed.data;

  await db.hospital.update({
    where: { id: hospitalId },
    data: {
      name: d.name,
      location: d.location,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone,
      baseUrl: d.baseUrl || null,
      apiKey: d.apiKey,
      connectionNotes: d.connectionNotes,
      parentHospitalId: d.parentHospitalId || null,
      agreementSignedAt: d.agreementSignedAt ? new Date(d.agreementSignedAt) : null,
      agreementNotes: d.agreementNotes,
    },
  });

  await writeAudit({
    actorId,
    actorRole,
    action: "admin.hospital.updated",
    targetId: hospitalId,
  });

  revalidatePath("/admin/platform/hospitals");
  revalidatePath("/admin/hospital");
  revalidatePath("/admin/hospital/settings");
  return { success: "Hospital details saved." };
}

export async function setHospitalSyncEnabled(hospitalId: string, enabled: boolean) {
  const { actorId, actorRole } = await requireHospitalManager(hospitalId);

  await db.hospital.update({ where: { id: hospitalId }, data: { syncEnabled: enabled } });
  await writeAudit({
    actorId,
    actorRole,
    action: enabled ? "admin.hospital.sync_resumed" : "admin.hospital.sync_paused",
    targetId: hospitalId,
  });

  revalidatePath("/admin/platform/hospitals");
  revalidatePath("/admin/hospital");
  revalidatePath("/admin/hospital/settings");
}

