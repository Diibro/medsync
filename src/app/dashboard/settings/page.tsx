import { Settings } from "lucide-react";
import { requirePatient } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/patient/settings/profile-form";
import { EmergencyProfileForm } from "@/components/patient/settings/emergency-profile-form";
import { PrivacyCard } from "@/components/patient/settings/privacy-card";
import { HospitalsCard } from "@/components/patient/settings/hospitals-card";

export default async function SettingsPage() {
  const { session, patient } = await requirePatient();

  const [allHospitals, linkedIdentifiers] = await Promise.all([
    db.hospital.findMany({ orderBy: { name: "asc" } }),
    db.externalIdentifier.findMany({
      where: { patientId: patient.id },
      include: { hospital: true },
      orderBy: { linkedAt: "desc" },
    }),
  ]);
  const linkedHospitalIds = new Set(linkedIdentifiers.map((l) => l.hospitalId));
  const availableHospitals = allHospitals.filter((h) => !linkedHospitalIds.has(h.id));

  return (
    <div className="p-4 lg:p-6 max-w-6xl flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-[#7CA6E8]" />
        <div>
          <h1 className="text-base font-semibold text-[#E7ECF5] leading-tight">Settings &amp; Privacy</h1>
          <p className="text-xs text-[#7488AA]">Manage your account and data preferences</p>
        </div>
      </div>

      <ProfileForm
        fullName={patient.fullName}
        dateOfBirth={patient.dateOfBirth.toISOString().slice(0, 10)}
        phone={patient.phone ?? ""}
        email={session.user.email}
        publicCode={patient.publicCode}
      />

      <PrivacyCard dataShareResearch={patient.dataShareResearch} />

      <EmergencyProfileForm
        bloodGroup={patient.bloodGroup ?? ""}
        genotype={patient.genotype ?? ""}
        allergies={patient.allergies.join(", ")}
      />

      <HospitalsCard availableHospitals={availableHospitals} linked={linkedIdentifiers} />
    </div>
  );
}
