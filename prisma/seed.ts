// Dev/demo seed data — see docs/USAGE.md for the resulting credentials. The initial hospitals and
// doctors are seeded here since M10's admin consoles need at least one admin account to log into
// in the first place; from there, more hospitals/doctors can be provisioned through /admin/hospital
// and /admin/platform instead of editing this file.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const HOSPITALS = [
  { name: "Lagos University Teaching Hospital (LUTH)", baseUrl: "http://localhost:5101/fhir" },
  { name: "Eko Hospital & Specialist Centre", baseUrl: "http://localhost:5102/fhir" },
  { name: "St. Nicholas Hospital, Lagos", baseUrl: "http://localhost:5103/fhir" },
];

const DOCTORS = [
  {
    email: "amara.okafor@luth.medsync.dev",
    fullName: "Dr. Amara Okafor",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    licenseId: "MDCN-2019-56432",
    specialty: "Cardiology",
    password: "doctor1234",
    pin: "1234",
  },
  {
    email: "chidera.nwosu@eko.medsync.dev",
    fullName: "Dr. Chidera Nwosu",
    hospitalName: "Eko Hospital & Specialist Centre",
    licenseId: "MDCN-2016-33210",
    specialty: "Endocrinology",
    password: "doctor1234",
    pin: "1234",
  },
];

const HOSPITAL_ADMINS = [
  {
    email: "admin@luth.medsync.dev",
    fullName: "Folake Adisa",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    password: "hospitaladmin1234",
  },
];

const PLATFORM_ADMINS = [
  { email: "platform-admin@medsync.dev", fullName: "MedSync Platform Team", password: "platformadmin1234" },
];

async function main() {
  const hospitalsByName = new Map<string, string>();

  for (const h of HOSPITALS) {
    const existing = await db.hospital.findFirst({ where: { name: h.name } });
    const hospital = existing ?? (await db.hospital.create({ data: h }));
    if (existing && existing.baseUrl !== h.baseUrl) {
      await db.hospital.update({ where: { id: existing.id }, data: { baseUrl: h.baseUrl } });
    }
    hospitalsByName.set(h.name, hospital.id);
    console.log(`Hospital ready: ${h.name} (${hospital.id})`);
  }

  for (const d of DOCTORS) {
    const existingUser = await db.user.findUnique({ where: { email: d.email } });
    if (existingUser) {
      console.log(`Doctor already exists: ${d.email}`);
      continue;
    }
    const hospitalId = hospitalsByName.get(d.hospitalName);
    if (!hospitalId) throw new Error(`Hospital not found: ${d.hospitalName}`);

    const passwordHash = await bcrypt.hash(d.password, 10);
    const pinHash = await bcrypt.hash(d.pin, 10);

    await db.user.create({
      data: {
        email: d.email,
        passwordHash,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            fullName: d.fullName,
            hospitalId,
            licenseId: d.licenseId,
            specialty: d.specialty,
            pinHash,
          },
        },
      },
    });
    console.log(`Doctor created: ${d.email} / ${d.password} (PIN ${d.pin})`);
  }

  for (const a of HOSPITAL_ADMINS) {
    const existingUser = await db.user.findUnique({ where: { email: a.email } });
    if (existingUser) {
      console.log(`Hospital admin already exists: ${a.email}`);
      continue;
    }
    const hospitalId = hospitalsByName.get(a.hospitalName);
    if (!hospitalId) throw new Error(`Hospital not found: ${a.hospitalName}`);

    const passwordHash = await bcrypt.hash(a.password, 10);
    await db.user.create({
      data: {
        email: a.email,
        passwordHash,
        role: "HOSPITAL_ADMIN",
        staffProfile: { create: { fullName: a.fullName, hospitalId } },
      },
    });
    console.log(`Hospital admin created: ${a.email} / ${a.password}`);
  }

  for (const a of PLATFORM_ADMINS) {
    const existingUser = await db.user.findUnique({ where: { email: a.email } });
    if (existingUser) {
      console.log(`Platform admin already exists: ${a.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(a.password, 10);
    await db.user.create({
      data: {
        email: a.email,
        passwordHash,
        role: "PLATFORM_ADMIN",
        staffProfile: { create: { fullName: a.fullName } },
      },
    });
    console.log(`Platform admin created: ${a.email} / ${a.password}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
