import { redirect } from "next/navigation";
import { requireDoctor } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { ConsentCodeStep } from "@/components/doctor/consent-code-step";

export default async function DoctorAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { doctor } = await requireDoctor();
  const { id } = await params;

  const consentCode = await db.consentCode.findUnique({
    where: { id },
    include: { patient: true },
  });

  if (!consentCode || consentCode.doctorId !== doctor.id || consentCode.consumedAt) {
    redirect("/doctor");
  }
  // Async Server Component, runs once per request on the server (not memoized/re-rendered like a
  // client component); real-time expiry needs Date.now().
  // eslint-disable-next-line react-hooks/purity
  if (consentCode.expiresAt.getTime() <= Date.now()) {
    redirect("/doctor");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <ConsentCodeStep consentCodeId={consentCode.id} patientName={consentCode.patient.fullName} />
    </div>
  );
}
