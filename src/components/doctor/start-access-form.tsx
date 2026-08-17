"use client";

import { useActionState, useState } from "react";
import { Shield, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startConsentRequest, startEmergencyOverride } from "@/lib/access/actions";

export function StartAccessForm() {
  const [consentState, consentAction, consentPending] = useActionState(startConsentRequest, undefined);
  const [overrideState, overrideAction, overridePending] = useActionState(startEmergencyOverride, undefined);
  const [showOverride, setShowOverride] = useState(false);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#152540] to-[#0F1830] border border-[#243149] rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-[#7CA6E8]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#E7ECF5]">Open a patient chart</h1>
            <p className="text-xs text-[#93A2C0]">Enter the code the patient shows you to ask for access.</p>
          </div>
        </div>

        <form action={consentAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publicCode">Patient access code</Label>
            <Input id="publicCode" name="publicCode" placeholder="e.g. AB3D9F2K" className="font-mono tracking-widest" required />
          </div>
          {consentState?.error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} /> {consentState.error}
            </p>
          )}
          <Button type="submit" disabled={consentPending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-10 gap-2">
            {consentPending ? "Requesting..." : "Request access"}
            {!consentPending && <ChevronRight size={16} />}
          </Button>
        </form>
      </div>

      <div>
        <button onClick={() => setShowOverride((s) => !s)} className="text-xs text-red-400 hover:underline font-medium">
          Emergency override
        </button>
      </div>

      {showOverride && (
        <div className="bg-[#121A2C] rounded-xl border border-red-900/40 shadow-sm p-6 flex flex-col gap-3">
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            Emergency override skips patient consent. It gets logged and flagged for review, so use
            it only for a genuine emergency.
          </p>
          <form action={overrideAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ovPublicCode">Patient access code</Label>
              <Input id="ovPublicCode" name="publicCode" className="font-mono tracking-widest" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ovPin">Your 4-digit PIN</Label>
              <Input id="ovPin" name="pin" type="password" maxLength={4} className="font-mono tracking-[0.5em]" required />
            </div>
            {overrideState?.error && <p className="text-xs text-red-400">{overrideState.error}</p>}
            <Button type="submit" disabled={overridePending} variant="destructive" className="h-10">
              {overridePending ? "Checking..." : "Override and open chart"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
