import Link from "next/link";
import { Activity, ShieldCheck, AlertTriangle, History, Sparkles } from "lucide-react";
import { requireDoctor } from "@/lib/auth/guard";
import { listDoctorSessions, getDoctorStats } from "@/lib/access/queries";
import { StartAccessForm } from "@/components/doctor/start-access-form";
import { SessionList } from "@/components/doctor/session-list";

export default async function DoctorHomePage() {
  const { doctor } = await requireDoctor();
  const [stats, recentSessions] = await Promise.all([
    getDoctorStats(doctor.id),
    listDoctorSessions(doctor.id, 5),
  ]);

  const firstName = doctor.fullName.split(" ")[1] ?? doctor.fullName;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#1B3A6B] via-[#20447F] to-[#2A5298] p-6 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Welcome back, {firstName}</h1>
            <p className="text-sm text-blue-100 mt-1">
              Every chart you open shows drug conflicts and health trends right away, no extra
              clicks needed.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs">
            <Sparkles size={14} className="text-amber-300" />
            AI review runs the moment a session starts
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Sessions today", value: stats.sessionsToday, icon: <Activity size={16} className="text-[#7CA6E8]" /> },
                { label: "Total sessions", value: stats.totalSessions, icon: <ShieldCheck size={16} className="text-green-400" /> },
                { label: "Flagged", value: stats.flagged, icon: <AlertTriangle size={16} className="text-red-400" /> },
              ].map((s) => (
                <div key={s.label} className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-3 flex items-center gap-2">
                  {s.icon}
                  <div>
                    <p className="text-lg font-bold text-[#E7ECF5] leading-tight">{s.value}</p>
                    <p className="text-xs text-[#7488AA]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <StartAccessForm />
          </div>

          <div className="lg:col-span-2 bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#E7ECF5]">Recent sessions</h2>
              <Link href="/doctor/history" className="text-xs text-[#7CA6E8] hover:underline flex items-center gap-1">
                <History size={12} /> View all
              </Link>
            </div>
            <SessionList sessions={recentSessions} />
          </div>
        </div>
      </div>
    </div>
  );
}
