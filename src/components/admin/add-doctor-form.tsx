"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDoctorAccount } from "@/lib/admin/actions";

export function AddDoctorForm() {
  const [state, action, pending] = useActionState(createDoctorAccount, undefined);

  return (
    <form action={action} key={state?.success ?? "form"} className="flex flex-col gap-3 border-t border-[#1C2740] pt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Full name</Label>
          <Input name="fullName" className="text-sm" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Specialty</Label>
          <Input name="specialty" className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Email</Label>
          <Input name="email" type="email" className="text-sm" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Temporary password</Label>
          <Input name="password" type="password" className="text-sm" minLength={8} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">License / Staff ID</Label>
          <Input name="licenseId" className="text-sm" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">4-digit PIN</Label>
          <Input name="pin" maxLength={4} inputMode="numeric" className="text-sm font-mono" required />
        </div>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-400">{state.success}</p>}
      <Button type="submit" disabled={pending} size="sm" className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit">
        {pending ? "Creating..." : "Add Doctor"}
      </Button>
    </form>
  );
}
