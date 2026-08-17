"use client";

import { useActionState, useTransition } from "react";
import { Building2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { linkHospital, resyncHospital } from "@/lib/hospitals/actions";

type LinkedHospital = {
  id: string;
  externalId: string;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  hospital: { id: string; name: string };
};

export function HospitalsCard({
  availableHospitals,
  linked,
}: {
  availableHospitals: { id: string; name: string }[];
  linked: LinkedHospital[];
}) {
  const [state, action, pending] = useActionState(linkHospital, undefined);
  const [syncing, startTransition] = useTransition();

  return (
    <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#E7ECF5] mb-1">Connected Hospitals</h3>
      <p className="text-xs text-[#7488AA] mb-4">
        Link a hospital using the patient ID they gave you. MedSync pulls your records from their
        system automatically.
      </p>

      {linked.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {linked.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-2 border border-[#1C2740] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 size={14} className="text-[#7CA6E8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-[#C3CEE3] truncate">{link.hospital.name}</p>
                  <p className="text-xs text-[#7488AA] flex items-center gap-1">
                    {link.lastSyncError ? (
                      <>
                        <AlertTriangle size={10} className="text-red-500" /> {link.lastSyncError}
                      </>
                    ) : link.lastSyncedAt ? (
                      <>
                        <CheckCircle2 size={10} className="text-green-500" /> Synced {link.lastSyncedAt.toLocaleString()}
                      </>
                    ) : (
                      "Not yet synced"
                    )}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={syncing}
                onClick={() => startTransition(() => resyncHospital(link.id))}
                className="gap-1.5 shrink-0"
              >
                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                Sync
              </Button>
            </div>
          ))}
        </div>
      )}

      {availableHospitals.length > 0 ? (
        <form action={action} className="flex flex-col gap-3 border-t border-[#1C2740] pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="w-full flex flex-col gap-1">
              <Label className="text-xs">Hospital</Label>
              <Select name="hospitalId" required>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Choose a hospital" />
                </SelectTrigger>
                <SelectContent>
                  {availableHospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Your patient ID there</Label>
              <Input name="externalId" placeholder="e.g. LUTH-0001" className="text-sm" required />
            </div>
          </div>
          {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
          {state?.success && <p className="text-xs text-green-600">{state.success}</p>}
          <Button type="submit" disabled={pending} className="bg-linear-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit" size="sm">
            {pending ? "Linking..." : "Link Hospital"}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-[#7488AA] border-t border-[#1C2740] pt-4">All available hospitals are already linked.</p>
      )}
    </div>
  );
}
