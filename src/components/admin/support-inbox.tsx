"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Phone, PhoneCall } from "lucide-react";
import { markContactResolved } from "@/lib/support/actions";

const topicLabels: Record<string, string> = {
  "how-it-works": "How the platform works",
  account: "Account trouble",
  hospital: "Linking a hospital",
  "doctor-access": "Doctor access",
  other: "Other",
};

export function SupportInbox({
  messages,
}: {
  messages: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    topic: string;
    message: string;
    status: string;
    createdAt: Date;
  }[];
}) {
  const [pending, startTransition] = useTransition();

  if (messages.length === 0) {
    return <p className="text-sm text-[#7488AA] py-8 text-center">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div key={m.id} className={`rounded-xl border p-4 ${m.status === "NEW" ? "border-[#3D5A8A] bg-[#152540]" : "border-[#1C2740] bg-[#0F1830]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#E7ECF5] truncate">{m.name}</p>
              <p className="text-xs text-[#7488AA] flex items-center gap-1 truncate">
                <Mail size={11} className="shrink-0" /> {m.email}
              </p>
              {m.phone && (
                <p className="text-xs text-[#7488AA] flex items-center gap-1">
                  <Phone size={11} className="shrink-0" /> {m.phone}
                </p>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-1.5 sm:shrink-0">
              <Badge variant="outline" className="text-xs px-1.5 py-0 text-[#7CA6E8] border-[#3D5A8A]">
                {topicLabels[m.topic] ?? m.topic}
              </Badge>
              {m.status === "NEW" ? (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-300 border-amber-700/50 bg-amber-500/10">
                  New
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-green-400 border-green-800 bg-green-500/10">
                  Resolved
                </Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-[#AEBBD6] leading-relaxed">{m.message}</p>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#1C2740]">
            <p className="text-xs text-[#7488AA]">{m.createdAt.toLocaleString()}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {m.phone && (
                <Button type="button" size="sm" variant="outline" render={<a href={`tel:${m.phone}`} />} className="gap-1 h-7 text-xs">
                  <PhoneCall size={12} /> Call
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" render={<a href={`mailto:${m.email}`} />} className="gap-1 h-7 text-xs">
                <Mail size={12} /> Email
              </Button>
              {m.status === "NEW" && (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => markContactResolved(m.id))}
                  className="gap-1 h-7 text-xs bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0"
                >
                  <CheckCircle2 size={12} /> Mark resolved
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
