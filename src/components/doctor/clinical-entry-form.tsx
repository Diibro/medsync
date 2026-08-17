"use client";

import { useActionState, useState, useEffect } from "react";
import { Stethoscope, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { addClinicalEntry } from "@/lib/access/actions";

const RECORD_TYPE_LABELS: Record<string, string> = {
  DIAGNOSIS: "Diagnosis",
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab report",
  PROCEDURE: "Procedure",
  VACCINATION: "Vaccination",
};

export function ClinicalEntryForm({ accessEventId, doctorName }: { accessEventId: string; doctorName: string }) {
  const boundAction = addClinicalEntry.bind(null, accessEventId);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [type, setType] = useState("DIAGNOSIS");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Reacting to a Server Action's result via useActionState has no non-effect equivalent —
    // there's no event handler to hook a "success" callback into.
    if (state && !state.error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
          <Stethoscope size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#E7ECF5]">Add clinical entry</h3>
          <p className="text-xs text-[#7488AA]">Recorded as {doctorName}</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4" key={saved ? "reset" : "form"}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Entry type</Label>
          <Select name="type" defaultValue={type} onValueChange={(value) => setType(value ?? "DIAGNOSIS")}>
            <SelectTrigger id="type">
              <SelectValue>{RECORD_TYPE_LABELS[type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIAGNOSIS">Diagnosis</SelectItem>
              <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
              <SelectItem value="LAB_REPORT">Lab Report</SelectItem>
              <SelectItem value="PROCEDURE">Procedure</SelectItem>
              <SelectItem value="VACCINATION">Vaccination</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">{type === "PRESCRIPTION" ? "Medication name and strength" : "Title"}</Label>
          <Input id="title" name="title" placeholder={type === "PRESCRIPTION" ? "e.g. Amlodipine 5mg" : "e.g. Hypertension Stage 1"} className="h-10" required />
        </div>

        {type === "PRESCRIPTION" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dosage">Dosage and frequency</Label>
              <Input id="dosage" name="dosage" placeholder="e.g. 5mg once daily" className="h-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" name="duration" placeholder="e.g. 30 days" className="h-10" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Clinical notes</Label>
          <Textarea id="description" name="description" rows={3} className="resize-none text-sm" />
        </div>

        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}

        {state?.conflicts && state.conflicts.length > 0 && (
          <div className="flex flex-col gap-2">
            {state.conflicts.map((c, i) => (
              <div key={i} className={`rounded-lg border p-2.5 ${c.severity === "high" ? "bg-red-500/10 border-red-900/40" : "bg-amber-500/10 border-amber-700/40"}`}>
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${c.severity === "high" ? "text-red-400" : "text-amber-400"}`} />
                  <div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {c.drugs.map((d) => (
                        <Badge key={d} variant="outline" className="text-xs px-1.5 py-0">
                          {d}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-[#AEBBD6]">{c.warning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          type="submit"
          disabled={pending || saved}
          className={`w-full h-10 gap-2 border-0 ${saved ? "bg-green-600 hover:bg-green-600" : "bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad]"} text-white`}
        >
          {saved ? (
            <>
              <CheckCircle2 size={15} /> Saved to patient record
            </>
          ) : (
            <>
              <ChevronRight size={15} /> {pending ? "Saving..." : "Save to patient record"}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
