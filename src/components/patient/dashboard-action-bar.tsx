"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UploadDocumentModal } from "@/components/patient/upload-document-modal";
import { setResearchSharing } from "@/lib/identity/actions";

export function DashboardActionBar({ dataShareResearch }: { dataShareResearch: boolean }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shared, setShared] = useState(dataShareResearch);
  const [, startTransition] = useTransition();

  return (
    <div className="px-4 lg:px-6 py-3 bg-[#121A2C] border-b border-[#1C2740] flex items-center gap-2 shrink-0">
      <Button onClick={() => setUploadOpen(true)} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 gap-2 text-sm" size="sm">
        <Upload size={14} />
        <span className="hidden sm:inline">Upload Document</span>
        <span className="sm:hidden">Upload</span>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Switch
          id="data-share"
          checked={shared}
          onCheckedChange={(checked) => {
            setShared(checked);
            startTransition(() => {
              setResearchSharing(checked);
            });
          }}
        />
        <Label htmlFor="data-share" className="text-xs text-[#93A2C0] cursor-pointer leading-tight hidden sm:block max-w-[180px]">
          Share anonymized data with MoH/Pharma for research
        </Label>
        <Label htmlFor="data-share" className="text-xs text-[#93A2C0] cursor-pointer sm:hidden">
          Research sharing {shared ? "On" : "Off"}
        </Label>
      </div>

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
