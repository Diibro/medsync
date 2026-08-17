import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/guard";
import { readUpload } from "@/lib/records/storage";

// Route Handler, not a Server Action: this is fetched by the browser via a plain URL (an <a href>
// or <img src>), not invoked from our own React tree. See docs/ARCHITECTURE.md §2.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await requireSession();
  const { key } = await params;
  const storageKey = key.join("/");

  const document = await db.document.findFirst({ where: { storageKey } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner =
    session.user.role === "PATIENT" &&
    (await db.patient.findUnique({ where: { userId: session.user.id } }))?.id === document.patientId;

  const isDoctorWithGrant =
    session.user.role === "DOCTOR" &&
    (await db.doctorProfile.findUnique({ where: { userId: session.user.id } }).then(
      async (doctor) =>
        doctor &&
        (await db.accessEvent.count({
          where: {
            doctorId: doctor.id,
            patientId: document.patientId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
        })) > 0
    ));

  if (!isOwner && !isDoctorWithGrant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readUpload(storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.fileName}"`,
    },
  });
}
