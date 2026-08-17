import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

// Data Access Layer entry point — every protected Server Component / Server Action should resolve
// its session through here rather than reading next-auth's session directly. See
// docs/ARCHITECTURE.md §3: this is the actual security boundary, not the optimistic proxy.ts check.
export const requireSession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
});

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/login");
  }
  return session;
}

export const requirePatient = cache(async () => {
  const session = await requireRole("PATIENT");
  const patient = await db.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient) redirect("/login");
  return { session, patient };
});

export const requireDoctor = cache(async () => {
  const session = await requireRole("DOCTOR");
  const doctor = await db.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: { hospital: true },
  });
  if (!doctor) redirect("/login");
  return { session, doctor };
});

export const requireHospitalAdmin = cache(async () => {
  const session = await requireRole("HOSPITAL_ADMIN");
  const staff = await db.staffProfile.findUnique({
    where: { userId: session.user.id },
    include: { hospital: true },
  });
  if (!staff || !staff.hospital) redirect("/login");
  return { session, staff, hospital: staff.hospital };
});

export const requirePlatformAdmin = cache(async () => {
  const session = await requireRole("PLATFORM_STAFF", "PLATFORM_ADMIN");
  const staff = await db.staffProfile.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/login");
  return { session, staff };
});
