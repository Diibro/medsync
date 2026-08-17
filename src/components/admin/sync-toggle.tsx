"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setHospitalSyncEnabled } from "@/lib/admin/actions";

export function SyncToggle({ hospitalId, enabled }: { hospitalId: string; enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-xs font-medium ${checked ? "text-green-400" : "text-amber-300"}`}>{checked ? "Active" : "Paused"}</span>
      <Switch
        checked={checked}
        onCheckedChange={(value) => {
          setChecked(value);
          startTransition(() => setHospitalSyncEnabled(hospitalId, value));
        }}
      />
    </div>
  );
}
