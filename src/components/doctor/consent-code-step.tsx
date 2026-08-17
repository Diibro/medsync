"use client";

import { useActionState } from "react";
import { AlertTriangle, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyConsentCode } from "@/lib/access/actions";

export function ConsentCodeStep({
  consentCodeId,
  patientName,
}: {
  consentCodeId: string;
  patientName: string;
}) {
  const boundAction = verifyConsentCode.bind(null, consentCodeId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="w-16 h-16 bg-gradient-to-br from-[#152540] to-[#0F1830] border border-[#243149] rounded-2xl flex items-center justify-center">
        <Shield size={32} className="text-[#7CA6E8]" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#E7ECF5] mb-1">Patient consent code</h2>
        <p className="text-sm text-[#93A2C0] max-w-xs mx-auto">
          A 6-digit code is showing on <strong className="text-[#C3CEE3]">{patientName}</strong>&apos;s
          own MedSync screen. Ask them to read it out to you.
        </p>
      </div>

      <form action={action} className="flex flex-col items-center gap-4 w-full">
        <InputOTPWrapper />
        {state?.error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} /> {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-11 gap-2">
          {pending ? "Opening chart..." : "Verify and open chart"}
          {!pending && <ChevronRight size={16} />}
        </Button>
      </form>
      <p className="text-xs text-[#7488AA] text-center max-w-xs">This code stops working 5 minutes after the request was made.</p>
    </div>
  );
}

function InputOTPWrapper() {
  return (
    <InputOTP maxLength={6} name="code">
      <InputOTPGroup className="gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl border-2 border-[#243149] rounded-xl font-bold text-[#7CA6E8] bg-[#121A2C]" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
