"use client";

import { useState, useTransition } from "react";
import { Building2, Mail, Phone, MapPin, Link2, FileCheck2, Pencil, Power } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HospitalForm } from "@/components/admin/hospital-form";
import { setHospitalSyncEnabled } from "@/lib/admin/actions";

type HospitalDetail = {
  id: string;
  name: string;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  connectionNotes: string | null;
  parentHospitalId: string | null;
  parentHospital: { id: string; name: string } | null;
  branches: { id: string; name: string }[];
  agreementSignedAt: Date | null;
  agreementNotes: string | null;
  syncEnabled: boolean;
  isVerified: boolean;
  doctors: { id: string; fullName: string; specialty: string | null }[];
  _count: { doctors: number; externalIdentifiers: number };
};

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={14} className="text-[#7CA6E8] shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-[#7488AA]">{label}</p>
        <p className="text-[#C3CEE3]">{value}</p>
      </div>
    </div>
  );
}

export function HospitalDetailSheet({
  hospital,
  otherHospitals,
  trigger,
  canEdit,
}: {
  hospital: HospitalDetail;
  otherHospitals: { id: string; name: string }[];
  trigger: React.ReactNode;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setEditing(false);
      }}
    >
      <SheetTrigger nativeButton={false} render={<span className="contents" />}>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-none sm:w-[70vw] lg:w-[70vw] bg-[#0E1526] border-[#1C2740] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#E7ECF5] flex items-center gap-2">
            <Building2 size={16} className="text-[#7CA6E8]" />
            {hospital.name}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6">
          {editing ? (
            <HospitalForm
              hospital={hospital}
              otherHospitals={otherHospitals.filter((h) => h.id !== hospital.id)}
              onSaved={() => setEditing(false)}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${hospital.syncEnabled ? "text-green-400 border-green-800 bg-green-500/10" : "text-amber-300 border-amber-700/50 bg-amber-500/10"}`}>
                  Sync {hospital.syncEnabled ? "active" : "paused"}
                </Badge>
                {hospital.parentHospital && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-[#7CA6E8] border-[#3D5A8A]">
                    Branch of {hospital.parentHospital.name}
                  </Badge>
                )}
                <span className="text-xs text-[#7488AA]">{hospital._count.doctors} doctors · {hospital._count.externalIdentifiers} linked patients</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Row icon={MapPin} label="Location" value={hospital.location} />
                <Row icon={Mail} label="Contact email" value={hospital.contactEmail} />
                <Row icon={Phone} label="Contact phone" value={hospital.contactPhone} />
                <Row icon={Link2} label="System base URL" value={hospital.baseUrl} />
              </div>

              {hospital.connectionNotes && <Row icon={Link2} label="Connection notes" value={hospital.connectionNotes} />}

              {(hospital.agreementSignedAt || hospital.agreementNotes) && (
                <div className="border-t border-[#1C2740] pt-4">
                  <Row
                    icon={FileCheck2}
                    label="Agreement"
                    value={
                      <>
                        {hospital.agreementSignedAt && <>Signed {hospital.agreementSignedAt.toLocaleDateString()}. </>}
                        {hospital.agreementNotes}
                      </>
                    }
                  />
                </div>
              )}

              {hospital.branches.length > 0 && (
                <div className="border-t border-[#1C2740] pt-4">
                  <p className="text-xs text-[#7488AA] mb-2">Branches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hospital.branches.map((b) => (
                      <Badge key={b.id} variant="outline" className="text-xs px-1.5 py-0 text-[#93A2C0] border-[#243149]">
                        {b.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[#1C2740] pt-4">
                <p className="text-xs text-[#7488AA] mb-2">Doctors ({hospital.doctors.length})</p>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {hospital.doctors.length === 0 && <p className="text-xs text-[#7488AA]">None yet.</p>}
                  {hospital.doctors.map((d) => (
                    <div key={d.id} className="text-sm text-[#C3CEE3] flex items-center justify-between">
                      <span>{d.fullName}</span>
                      <span className="text-xs text-[#7488AA]">{d.specialty ?? "General"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                    <Pencil size={12} /> Edit details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => startTransition(() => setHospitalSyncEnabled(hospital.id, !hospital.syncEnabled))}
                    className="gap-1.5"
                  >
                    <Power size={12} /> {hospital.syncEnabled ? "Pause sync" : "Resume sync"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
