"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHospital } from "@/lib/admin/actions";

export function AddHospitalForm() {
  const [state, action, pending] = useActionState(createHospital, undefined);

  return (
    <form action={action} key={state?.success ?? "form"} className="flex flex-col gap-3 border-t border-[#1C2740] pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Hospital name</Label>
          <Input name="name" className="text-sm" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">System base URL (optional)</Label>
          <Input name="baseUrl" placeholder="http://localhost:5104" className="text-sm" />
        </div>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-400">{state.success}</p>}
      <Button type="submit" disabled={pending} size="sm" className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit">
        {pending ? "Onboarding..." : "Onboard Hospital"}
      </Button>
    </form>
  );
}
