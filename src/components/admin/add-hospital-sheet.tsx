"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HospitalForm } from "@/components/admin/hospital-form";

export function AddHospitalSheet({ existingHospitals }: { existingHospitals: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} size="sm" className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 gap-1.5 w-fit">
        <Plus size={14} /> Add hospital
      </Button>
      <SheetContent side="right" className="w-full sm:max-w-none sm:w-[70vw] lg:w-[70vw] bg-[#0E1526] border-[#1C2740] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#E7ECF5]">Onboard a hospital</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <HospitalForm otherHospitals={existingHospitals} onSaved={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
