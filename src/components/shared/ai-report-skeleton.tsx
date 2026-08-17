import { Sparkles, Loader2 } from "lucide-react";

export function AiReportSkeleton() {
  return (
    <div className="rounded-xl border border-[#3D5A8A]/25 bg-gradient-to-br from-[#152540] to-[#121A2C] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[#1B3A6B] flex items-center gap-2">
        <Sparkles size={16} className="text-blue-200" />
        <h2 className="text-white text-sm font-semibold flex-1">Generating summary...</h2>
        <Loader2 size={14} className="text-blue-200 animate-spin" />
      </div>
      <div className="p-4 flex flex-col gap-2.5 animate-pulse">
        <div className="h-3 bg-[#243149] rounded w-full" />
        <div className="h-3 bg-[#243149] rounded w-5/6" />
        <div className="h-3 bg-[#243149] rounded w-2/3" />
        <div className="h-2" />
        <div className="h-2.5 bg-[#243149] rounded w-1/3" />
        <div className="h-3 bg-[#243149] rounded w-4/5" />
      </div>
    </div>
  );
}
