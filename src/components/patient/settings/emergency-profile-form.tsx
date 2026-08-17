"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEmergencyProfile } from "@/lib/identity/actions";

export function EmergencyProfileForm({
  bloodGroup,
  genotype,
  allergies,
}: {
  bloodGroup: string;
  genotype: string;
  allergies: string;
}) {
  const [state, action, pending] = useActionState(updateEmergencyProfile, undefined);

  return (
    <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#E7ECF5] mb-4">Emergency Profile</h3>
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Blood Group</Label>
            <Input name="bloodGroup" defaultValue={bloodGroup} className="text-sm" placeholder="e.g. O+" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Genotype</Label>
            <Input name="genotype" defaultValue={genotype} className="text-sm" placeholder="e.g. AA" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Known Allergies (comma separated)</Label>
          <Input name="allergies" defaultValue={allergies} className="text-sm" placeholder="Penicillin, Aspirin" />
        </div>
        {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
        <Button type="submit" disabled={pending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit mt-1" size="sm">
          {pending ? "Saving..." : "Save Emergency Profile"}
        </Button>
      </form>
    </div>
  );
}
