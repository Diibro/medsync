import { AlertTriangle, TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Conflict, TrendCard } from "@/lib/ai/rules";

const severityConfig: Record<string, { bg: string; border: string; badge: string; icon: string; label: string }> = {
  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700 border-red-200", icon: "text-red-500", label: "High Risk" },
  moderate: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-500", label: "Moderate" },
};

const trendIcon = {
  up: <TrendingUp size={14} className="text-red-500" />,
  down: <TrendingDown size={14} className="text-green-500" />,
  stable: <Minus size={14} className="text-[#7488AA]" />,
};
const trendColor = { up: "text-red-600", down: "text-green-600", stable: "text-[#93A2C0]" };

export function AIInsightsPanel({ conflicts, trends, compact = false }: { conflicts: Conflict[]; trends: TrendCard[]; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-[#3D5A8A]/15 bg-gradient-to-br from-[#152540] to-[#121A2C] shadow-sm overflow-hidden">
      {!compact && (
        <div className="px-4 py-3 bg-[#1B3A6B] flex items-center gap-2">
          <Brain size={16} className="text-blue-200" />
          <h2 className="text-white text-sm font-semibold">AI Health Insights</h2>
        </div>
      )}

      <div className="p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} />
            Drug Conflict Warnings
          </h3>
          {conflicts.length === 0 ? (
            <p className="text-xs text-[#7488AA]">No conflicts detected among current prescriptions.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {conflicts.map((c, i) => {
                const cfg = severityConfig[c.severity];
                return (
                  <div key={i} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className={`${cfg.icon} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {c.drugs.map((d) => (
                            <Badge key={d} variant="outline" className={`text-xs px-1.5 py-0 ${cfg.badge}`}>
                              {d}
                            </Badge>
                          ))}
                          <Badge variant="outline" className={`text-xs px-1.5 py-0 ml-auto ${cfg.badge}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#AEBBD6] leading-relaxed">{c.warning}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#7CA6E8] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Health Trend Summary
          </h3>
          {trends.length === 0 ? (
            <p className="text-xs text-[#7488AA]">No vitals recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {trends.map((t) => (
                <div key={t.type} className="rounded-lg border border-[#243149] bg-[#121A2C] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#93A2C0]">{t.label}</span>
                    {trendIcon[t.direction]}
                  </div>
                  <p className={`text-sm font-semibold ${trendColor[t.direction]}`}>{t.value}</p>
                  <p className="text-xs text-[#7488AA] mt-0.5 leading-tight">{t.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
