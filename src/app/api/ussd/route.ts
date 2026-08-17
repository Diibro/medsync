import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit/log";

// USSD gateway webhook — Africa's Talking-style callback (form-encoded sessionId/phoneNumber/text).
// Independent of the web app's NextAuth session: a USSD session is identified only by phone
// number, for patients without a smartphone or data plan. See docs/ARCHITECTURE.md §2 and §6, and
// docs/PROGRESS.md M9 notes. Response is plain text: "CON " continues the session, "END " closes it.
function respond(body: string) {
  return new NextResponse(body, { headers: { "Content-Type": "text/plain" } });
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, "");
}

const MAIN_MENU = "CON Welcome to MedSync\n1. Emergency Info\n2. Recent Records";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const params = contentType.includes("application/json") ? await req.json() : Object.fromEntries(await req.formData());

  const phoneNumber = String(params.phoneNumber ?? "");
  const text = String(params.text ?? "");
  const selection = text.split("*").filter(Boolean).pop() ?? "";

  if (!phoneNumber) {
    return respond("END A phone number is required.");
  }

  if (selection === "") {
    return respond(MAIN_MENU);
  }

  const patient = await db.patient.findFirst({ where: { phone: normalizePhone(phoneNumber) } });

  if (!patient) {
    return respond("END No MedSync account found for this phone number.");
  }

  if (selection === "1") {
    await writeAudit({ actorId: patient.id, actorRole: "PATIENT", action: "ussd.emergency_info.viewed", targetId: patient.id });
    const lines = [
      `Blood Group: ${patient.bloodGroup ?? "Not set"}`,
      `Genotype: ${patient.genotype ?? "Not set"}`,
      `Allergies: ${patient.allergies.length ? patient.allergies.join(", ") : "None recorded"}`,
    ];
    return respond(`END ${lines.join("\n")}`);
  }

  if (selection === "2") {
    const records = await db.medicalRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { occurredAt: "desc" },
      take: 3,
      select: { title: true, occurredAt: true },
    });
    await writeAudit({ actorId: patient.id, actorRole: "PATIENT", action: "ussd.records_summary.viewed", targetId: patient.id });
    if (records.length === 0) {
      return respond("END No records found.");
    }
    const lines = records.map((r, i) => `${i + 1}. ${r.title} (${r.occurredAt.toLocaleDateString()})`);
    return respond(`END Recent records:\n${lines.join("\n")}`);
  }

  return respond("END Invalid option.");
}
