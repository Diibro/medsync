"use client";

import { useActionState, useState } from "react";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VITALS_CONFIG } from "@/lib/ai/vitals";
import type { ObservationType } from "@/generated/prisma/enums";

type FormState = { error?: string; success?: string } | undefined;
type VitalsAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function VitalsForm({ action }: { action: VitalsAction }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<ObservationType>("BLOOD_PRESSURE");

  return (
    <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4">
      <h3 className="text-sm font-semibold text-[#E7ECF5] mb-3 flex items-center gap-2">
        <Activity size={15} className="text-[#7CA6E8]" />
        Record Vitals
      </h3>
      <form action={formAction} key={state?.success ? "reset" : "form"} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Type</Label>
            <Select name="type" defaultValue={type} onValueChange={(v) => setType((v ?? "BLOOD_PRESSURE") as ObservationType)}>
              <SelectTrigger className="text-sm">
                <SelectValue>{VITALS_CONFIG[type].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VITALS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Value ({VITALS_CONFIG[type].unit})</Label>
            <Input name="value" type="number" step="0.1" placeholder={VITALS_CONFIG[type].placeholder} className="text-sm" required />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Note (optional, e.g. full &quot;128/82&quot; reading)</Label>
          <Input name="note" className="text-sm" placeholder="Shown instead of the raw number if provided" />
        </div>
        {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
        <Button type="submit" disabled={pending} size="sm" className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 w-fit">
          {pending ? "Saving..." : "Save Vitals"}
        </Button>
      </form>
    </div>
  );
}
