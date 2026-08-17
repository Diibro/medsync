"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createHospital, updateHospital, type FormState } from "@/lib/admin/actions";

type HospitalFormValues = {
  id: string;
  name: string;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  connectionNotes: string | null;
  parentHospitalId: string | null;
  agreementSignedAt: Date | null;
  agreementNotes: string | null;
};

export function HospitalForm({
  hospital,
  otherHospitals,
  onSaved,
}: {
  hospital?: HospitalFormValues;
  otherHospitals: { id: string; name: string }[];
  onSaved?: () => void;
}) {
  const action = hospital ? updateHospital.bind(null, hospital.id) : createHospital;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.success && onSaved) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-3">Basics</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Hospital name *</Label>
            <Input id="name" name="name" defaultValue={hospital?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Lagos, Nigeria" defaultValue={hospital?.location ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={hospital?.contactEmail ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={hospital?.contactPhone ?? ""} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-4">
          <Label htmlFor="parentHospitalId">Part of another hospital?</Label>
          <Select name="parentHospitalId" defaultValue={hospital?.parentHospitalId ?? "none"}>
            <SelectTrigger id="parentHospitalId">
              <SelectValue>
                {(value: string) => otherHospitals.find((h) => h.id === value)?.name ?? "Independent hospital"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Independent hospital</SelectItem>
              {otherHospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  Branch of {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-[#1C2740] pt-4">
        <p className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-3">System connection</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baseUrl">System base URL</Label>
            <Input id="baseUrl" name="baseUrl" placeholder="http://localhost:5104" defaultValue={hospital?.baseUrl ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apiKey">API key (optional)</Label>
            <Input id="apiKey" name="apiKey" type="password" placeholder="Sent as a Bearer token" defaultValue={hospital?.apiKey ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="connectionNotes">Connection notes</Label>
            <Textarea id="connectionNotes" name="connectionNotes" rows={2} className="resize-none" defaultValue={hospital?.connectionNotes ?? ""} />
          </div>
        </div>
      </div>

      <div className="border-t border-[#1C2740] pt-4">
        <p className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-3">Agreement</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agreementSignedAt">Signed on</Label>
            <Input
              id="agreementSignedAt"
              name="agreementSignedAt"
              type="date"
              defaultValue={hospital?.agreementSignedAt ? hospital.agreementSignedAt.toISOString().slice(0, 10) : ""}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-4">
          <Label htmlFor="agreementNotes">Agreement notes</Label>
          <Textarea id="agreementNotes" name="agreementNotes" rows={2} className="resize-none" placeholder="Terms, reference number, renewal date..." defaultValue={hospital?.agreementNotes ?? ""} />
        </div>
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-400">{state.success}</p>}

      <Button type="submit" disabled={pending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-11">
        {pending ? "Saving..." : hospital ? "Save changes" : "Onboard hospital"}
      </Button>
    </form>
  );
}
