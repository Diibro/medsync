"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/identity/actions";

export function ProfileForm({
  fullName,
  dateOfBirth,
  phone,
  email,
  publicCode,
}: {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  publicCode: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#E7ECF5] mb-4">Profile</h3>
      <p className="text-xs text-[#7488AA] mb-4">
        {email} · Patient Code: {publicCode}
      </p>
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Full name</Label>
            <Input name="fullName" defaultValue={fullName} className="text-sm" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Date of Birth</Label>
            <Input name="dateOfBirth" defaultValue={dateOfBirth} type="date" className="text-sm" required />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Phone</Label>
          <Input name="phone" defaultValue={phone} className="text-sm" />
        </div>
        {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
        <Button type="submit" disabled={pending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit mt-1" size="sm">
          {pending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
