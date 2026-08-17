import { requirePatient } from "@/lib/auth/guard";
import { getPendingConsentRequests } from "@/lib/access/queries";
import { EmergencyHeader } from "@/components/patient/emergency-header";
import { SidebarNav } from "@/components/patient/sidebar-nav";
import { BottomNav } from "@/components/patient/bottom-nav";
import { DashboardActionBar } from "@/components/patient/dashboard-action-bar";
import { PendingConsentBanner } from "@/components/patient/pending-consent-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { patient } = await requirePatient();
  const pendingRequests = await getPendingConsentRequests(patient.id);

  return (
    <div className="h-dvh flex flex-col bg-[#0B1220] font-sans">
      <EmergencyHeader
        bloodGroup={patient.bloodGroup}
        genotype={patient.genotype}
        allergies={patient.allergies}
        publicCode={patient.publicCode}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarNav fullName={patient.fullName} publicCode={patient.publicCode} />

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <DashboardActionBar dataShareResearch={patient.dataShareResearch} />

          {pendingRequests.length > 0 && (
            <div className="px-4 lg:px-6 pt-3 shrink-0">
              <PendingConsentBanner requests={pendingRequests} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain pb-20 lg:pb-4">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
