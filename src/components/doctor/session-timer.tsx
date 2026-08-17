"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";

function formatTime(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function SessionTimer({ expiresAt, totalSeconds }: { expiresAt: string; totalSeconds: number }) {
  const expiresAtMs = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => Math.round((expiresAtMs - Date.now()) / 1000));
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.round((expiresAtMs - Date.now()) / 1000);
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        startTransition(() => router.refresh());
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAtMs, router]);

  const pct = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
  const urgent = remaining <= 60;
  const warning = remaining <= 180;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${urgent ? "bg-red-600" : warning ? "bg-amber-500" : "bg-gradient-to-r from-[#1B3A6B] to-[#2A5298]"} text-white sticky top-0 z-20 transition-colors`}>
      <Timer size={15} className="shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">
            {urgent ? "Session ending soon" : warning ? "Less than 3 minutes left" : "Active session"}
          </span>
          <span className={`text-sm font-bold font-mono ${urgent ? "animate-pulse" : ""}`}>{formatTime(remaining)}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1">
          <div className={`h-1 rounded-full transition-all ${urgent ? "bg-red-200" : warning ? "bg-amber-200" : "bg-blue-200"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
