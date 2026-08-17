"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setResearchSharing } from "@/lib/identity/actions";

export function PrivacyCard({ dataShareResearch }: { dataShareResearch: boolean }) {
  const [shared, setShared] = useState(dataShareResearch);
  const [, startTransition] = useTransition();

  return (
    <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-[#E7ECF5] mb-4">Privacy &amp; Data Sharing</h3>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#C3CEE3]">Share anonymized data with MoH/Pharma</p>
          <p className="text-xs text-[#7488AA] mt-0.5 leading-relaxed">
            Contribute de-identified health data to government and pharmaceutical research. No
            personally identifiable information is shared.
          </p>
        </div>
        <Switch
          checked={shared}
          onCheckedChange={(checked) => {
            setShared(checked);
            startTransition(() => {
              setResearchSharing(checked);
            });
          }}
          className="shrink-0 mt-0.5"
        />
      </div>
    </div>
  );
}
