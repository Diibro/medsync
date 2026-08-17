"use client";

import { useState } from "react";
import { AlertTriangle, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EmergencyHeader({
  bloodGroup,
  genotype,
  allergies,
  publicCode,
}: {
  bloodGroup: string | null;
  genotype: string | null;
  allergies: string[];
  publicCode: string;
}) {
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-gradient-to-r from-[#1B3A6B] via-[#20447F] to-[#1B3A6B] text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle size={15} className="text-amber-300 shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide text-amber-300">
            Emergency Info
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto sm:flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-xs text-blue-200">Blood Group:</span>
            <Badge className="bg-red-600 text-white border-0 text-xs px-2 py-0.5 whitespace-nowrap">
              {bloodGroup ?? "—"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-xs text-blue-200">Genotype:</span>
            <Badge className="bg-[#2563EB] text-white border-0 text-xs px-2 py-0.5 whitespace-nowrap">
              {genotype ?? "—"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-xs text-blue-200">Allergies:</span>
            {allergies.length === 0 ? (
              <span className="text-xs text-blue-200/70 whitespace-nowrap">None recorded</span>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                {allergies.slice(0, 2).map((allergy) => (
                  <Badge
                    key={allergy}
                    className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs px-2 py-0.5 whitespace-nowrap"
                  >
                    {allergy}
                  </Badge>
                ))}
                {allergies.length > 2 && (
                  <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs px-2 py-0.5 whitespace-nowrap">
                    +{allergies.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setCodeOpen(true)}
          className="bg-white text-[#1B3A6B] hover:bg-blue-50 border-0 text-xs px-2.5 sm:px-3 py-1.5 h-auto shrink-0 gap-1.5 font-medium"
        >
          <KeyRound size={14} />
          <span className="hidden sm:inline">Doctor Access Code</span>
          <span className="sm:hidden">Code</span>
        </Button>
      </div>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#7CA6E8]">Your Doctor Access Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-full bg-[#152540] rounded-xl border-2 border-[#3D5A8A]/20 py-8 flex items-center justify-center">
              <span className="text-3xl font-bold tracking-[0.3em] text-[#7CA6E8] font-mono">{publicCode}</span>
            </div>
            <p className="text-sm text-[#AEBBD6] text-center">
              Give this code to your doctor so they can find your chart. They will still need a
              one time code you read out loud before they can see anything.
            </p>
            <div className="bg-[#FFF3CD] border border-amber-200 rounded-lg px-4 py-3 w-full">
              <p className="text-xs text-amber-800">
                <strong>Emergency Info:</strong> Blood Group {bloodGroup ?? "not set"}, Genotype {genotype ?? "not set"},
                Allergic to {allergies.length ? allergies.join(", ") : "none recorded"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
