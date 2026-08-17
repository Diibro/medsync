"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Sparkles } from "lucide-react";
import { uploadDocument, confirmOcrDraft, discardOcrDraft } from "@/lib/records/actions";
import type { OcrDraft } from "@/lib/ai/ocr";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lab: "Lab report",
  scan: "Scan or imaging",
  discharge: "Discharge summary",
  prescription: "Prescription sheet",
  referral: "Referral letter",
  other: "Other",
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  DIAGNOSIS: "Diagnosis",
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab report",
  PROCEDURE: "Procedure",
  VACCINATION: "Vaccination",
};

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState(uploadDocument, undefined);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    // Reacting to a Server Action's result via useActionState has no non-effect equivalent —
    // there's no event handler to hook a "success" callback into. A draft means we stay open on
    // the review step instead of closing.
    if (state?.success && !state.draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  if (state?.documentId && state.draft) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#7CA6E8]">
              <Sparkles size={18} />
              Review Extracted Details
            </DialogTitle>
          </DialogHeader>
          <OcrDraftReview
            documentId={state.documentId}
            draft={state.draft}
            onDone={() => {
              setFile(null);
              onClose();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#7CA6E8]">
            <Upload size={18} />
            Upload Medical Document
          </DialogTitle>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4 mt-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer ${
              dragOver ? "border-[#3D5A8A] bg-[#152540]" : file ? "border-green-400 bg-green-50" : "border-[#2A3A56] bg-[#0F1830] hover:border-[#3D5A8A] hover:bg-[#152540]"
            }`}
          >
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={28} className="text-[#7CA6E8]" />
                <span className="text-sm font-medium text-[#C3CEE3]">{file.name}</span>
                <span className="text-xs text-[#7488AA]">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload size={28} className="text-[#7488AA]" />
                <p className="text-sm font-medium text-[#AEBBD6]">Drag &amp; drop or click to upload</p>
                <p className="text-xs text-[#7488AA]">PDF, JPG, PNG, DOC, max 20MB</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documentType">Document type</Label>
              <Select name="documentType" defaultValue="lab">
                <SelectTrigger id="documentType">
                  <SelectValue>{(value: string) => DOCUMENT_TYPE_LABELS[value] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">Lab report</SelectItem>
                  <SelectItem value="scan">Scan or imaging</SelectItem>
                  <SelectItem value="discharge">Discharge summary</SelectItem>
                  <SelectItem value="prescription">Prescription sheet</SelectItem>
                  <SelectItem value="referral">Referral letter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="occurredAt">Document Date</Label>
              <Input id="occurredAt" name="occurredAt" type="date" required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Notes (optional)</Label>
            <Input id="note" name="note" placeholder="e.g. ECG from cardiology appointment" />
          </div>

          <div className="bg-[#152540] border border-[#3D5A8A]/15 rounded-lg px-4 py-3">
            <p className="text-xs text-[#7CA6E8]">
              Documents are stored privately. Only you and doctors you grant access to can view them.
            </p>
          </div>

          {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
          {state?.success && !state.draft && <p className="text-xs text-green-600">{state.success}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || pending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0">
              {pending ? "Uploading..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OcrDraftReview({
  documentId,
  draft,
  onDone,
}: {
  documentId: string;
  draft: OcrDraft;
  onDone: () => void;
}) {
  const confirmAction = confirmOcrDraft.bind(null, documentId);
  const [state, action, pending] = useActionState(confirmAction, undefined);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    if (state?.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="bg-[#152540] border border-[#3D5A8A]/15 rounded-lg px-4 py-3 flex items-start gap-2">
        <Sparkles size={14} className="text-[#7CA6E8] shrink-0 mt-0.5" />
        <p className="text-xs text-[#7CA6E8]">
          Claude read your document and drafted these details. Check them over. Nothing is saved to
          your record until you confirm.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Entry type</Label>
            <Select name="type" defaultValue={draft?.type ?? "LAB_REPORT"}>
              <SelectTrigger id="type">
                <SelectValue>{(value: string) => RECORD_TYPE_LABELS[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIAGNOSIS">Diagnosis</SelectItem>
                <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                <SelectItem value="LAB_REPORT">Lab report</SelectItem>
                <SelectItem value="PROCEDURE">Procedure</SelectItem>
                <SelectItem value="VACCINATION">Vaccination</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurredAt">Date</Label>
            <Input id="occurredAt" name="occurredAt" type="date" defaultValue={draft?.occurredAt || undefined} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={draft?.title} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctorName">Doctor&apos;s Name (optional)</Label>
          <Input id="doctorName" name="doctorName" defaultValue={draft?.doctorName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} className="resize-none text-sm" defaultValue={draft?.description} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" defaultValue={draft?.tags?.join(", ")} />
        </div>

        {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

        <DialogFooter className="gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || discarding}
            onClick={async () => {
              setDiscarding(true);
              await discardOcrDraft(documentId);
              onDone();
            }}
          >
            {discarding ? "Saving..." : "Skip and save file only"}
          </Button>
          <Button type="submit" disabled={pending || discarding} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0">
            {pending ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
