import "server-only";
import { db } from "@/lib/db";
import { requireDoctor } from "@/lib/auth/guard";

// The actual security boundary for "is this doctor allowed to touch this patient's chart right
// now" — re-checked on every action, never trusted from the client's countdown timer. See
// docs/ARCHITECTURE.md §3.
export async function requireActiveAccessGrant(accessEventId: string) {
  const { session, doctor } = await requireDoctor();

  const grant = await db.accessEvent.findUnique({
    where: { id: accessEventId },
    include: { patient: true },
  });

  if (!grant || grant.doctorId !== doctor.id) {
    throw new Error("No such access grant.");
  }

  if (grant.status !== "ACTIVE" || grant.expiresAt.getTime() <= Date.now()) {
    if (grant.status === "ACTIVE") {
      await db.accessEvent.update({ where: { id: grant.id }, data: { status: "EXPIRED" } });
    }
    throw new Error("This access session has expired.");
  }

  return { session, doctor, grant };
}
