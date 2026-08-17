"use client";

import { useTransition } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { denyConsentRequest } from "@/lib/access/actions";

export function PendingConsentBanner({
  requests,
}: {
  requests: { id: string; code: string; doctorName: string; hospitalName: string; expiresAt: Date }[];
}) {
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {requests.map((req) => (
        <div key={req.id} className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <KeyRound size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {req.doctorName} at {req.hospitalName} is requesting access
            </p>
            <p className="text-xs text-amber-700">
              Read them this code: <span className="font-mono font-bold text-base tracking-widest">{req.code}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => denyConsentRequest(req.id))}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-1"
          >
            <X size={12} /> Deny
          </Button>
        </div>
      ))}
    </div>
  );
}
