"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/auth/password";
import { generatePublicCode } from "@/lib/identity/public-code";
import { signIn, signOut } from "@/auth";
import { requirePatient } from "@/lib/auth/guard";
import { writeAudit } from "@/lib/audit/log";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  dateOfBirth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date of birth."),
  phone: z.string().trim().optional(),
});

async function uniquePublicCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePublicCode();
    const existing = await db.patient.findUnique({ where: { publicCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique patient code. Please try again.");
}

export async function registerPatient(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const { fullName, email, password, dateOfBirth, phone } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashSecret(password);
  const publicCode = await uniquePublicCode();

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "PATIENT",
      patient: {
        create: {
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          phone,
          publicCode,
          allergies: [],
        },
      },
    },
    include: { patient: true },
  });

  await writeAudit({
    actorId: user.id,
    actorRole: "PATIENT",
    action: "patient.registered",
    targetId: user.patient!.id,
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return undefined;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginWithCredentials(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { error: "Incorrect email or password." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  redirect(homeForRole(user?.role));
}

function homeForRole(role: string | undefined) {
  if (role === "DOCTOR") return "/doctor";
  if (role === "HOSPITAL_ADMIN") return "/admin/hospital";
  if (role === "PLATFORM_STAFF" || role === "PLATFORM_ADMIN") return "/admin/platform";
  return "/dashboard";
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function setResearchSharing(enabled: boolean) {
  const { patient } = await requirePatient();
  await db.patient.update({ where: { id: patient.id }, data: { dataShareResearch: enabled } });
  await writeAudit({
    actorId: patient.id,
    actorRole: "PATIENT",
    action: enabled ? "patient.research_sharing.enabled" : "patient.research_sharing.disabled",
    targetId: patient.id,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  dateOfBirth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date of birth."),
  phone: z.string().trim().optional(),
});

export async function updateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { patient } = await requirePatient();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  await db.patient.update({
    where: { id: patient.id },
    data: {
      fullName: parsed.data.fullName,
      dateOfBirth: new Date(parsed.data.dateOfBirth),
      phone: parsed.data.phone,
    },
  });
  revalidatePath("/dashboard/settings");
  return { error: undefined };
}

const emergencyProfileSchema = z.object({
  bloodGroup: z.string().trim().optional(),
  genotype: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
});

export async function updateEmergencyProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { patient } = await requirePatient();
  const parsed = emergencyProfileSchema.safeParse({
    bloodGroup: formData.get("bloodGroup") || undefined,
    genotype: formData.get("genotype") || undefined,
    allergies: formData.get("allergies") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const allergies = parsed.data.allergies
    ? parsed.data.allergies.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  await db.patient.update({
    where: { id: patient.id },
    data: { bloodGroup: parsed.data.bloodGroup, genotype: parsed.data.genotype, allergies },
  });
  await writeAudit({
    actorId: patient.id,
    actorRole: "PATIENT",
    action: "patient.emergency_profile.updated",
    targetId: patient.id,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { error: undefined };
}
