import Link from "next/link";
import { Users, ShieldCheck, FileText, AlertTriangle, Building2, MessageCircle, Download, ArrowRight } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { getPlatformStats, listFlaggedAccessEvents } from "@/lib/admin/queries";

export default async function PlatformAdminOverviewPage() {
  const { staff } = await requirePlatformAdmin();
  const [stats, flagged] = await Promise.all([getPlatformStats(), listFlaggedAccessEvents()]);

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#1B3A6B] via-[#20447F] to-[#2A5298] p-6 text-white">
        <h1 className="text-xl font-bold">Welcome, {staff.fullName}</h1>
        <p className="text-sm text-blue-100 mt-1">Here is how MedSync is doing across every connected hospital.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Patients", value: stats.patients, icon: <Users size={16} className="text-[#7CA6E8]" /> },
          { label: "Hospitals", value: stats.hospitals, icon: <Building2 size={16} className="text-blue-400" /> },
          { label: "Records", value: stats.records, icon: <FileText size={16} className="text-purple-400" /> },
          { label: "Flagged events", value: stats.flagged, icon: <AlertTriangle size={16} className="text-red-400" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xl font-bold text-[#E7ECF5] leading-tight">{s.value}</p>
              <p className="text-xs text-[#7488AA]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link href="/admin/platform/hospitals" className="bg-[#121A2C] rounded-xl border border-[#243149] p-5 hover:border-[#3D5A8A] transition-colors flex flex-col gap-2">
          <Building2 size={20} className="text-[#7CA6E8]" />
          <p className="text-sm font-semibold text-[#E7ECF5]">Manage hospitals</p>
          <p className="text-xs text-[#7488AA]">Onboard a new hospital or check who is already connected.</p>
          <span className="text-xs text-[#7CA6E8] flex items-center gap-1 mt-1">Open <ArrowRight size={12} /></span>
        </Link>
        <Link href="/admin/platform/support" className="bg-[#121A2C] rounded-xl border border-[#243149] p-5 hover:border-[#3D5A8A] transition-colors flex flex-col gap-2">
          <MessageCircle size={20} className="text-[#7CA6E8]" />
          <p className="text-sm font-semibold text-[#E7ECF5] flex items-center gap-2">
            Support messages
            {stats.openMessages > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{stats.openMessages}</span>
            )}
          </p>
          <p className="text-xs text-[#7488AA]">Read what people are asking and mark things resolved.</p>
          <span className="text-xs text-[#7CA6E8] flex items-center gap-1 mt-1">Open <ArrowRight size={12} /></span>
        </Link>
        <Link href="/admin/platform/logs" className="bg-[#121A2C] rounded-xl border border-[#243149] p-5 hover:border-[#3D5A8A] transition-colors flex flex-col gap-2">
          <ShieldCheck size={20} className="text-[#7CA6E8]" />
          <p className="text-sm font-semibold text-[#E7ECF5]">Audit log</p>
          <p className="text-xs text-[#7488AA]">Every action taken across the platform, in order.</p>
          <span className="text-xs text-[#7CA6E8] flex items-center gap-1 mt-1">Open <ArrowRight size={12} /></span>
        </Link>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <h2 className="text-sm font-semibold text-[#E7ECF5] mb-3 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400" />
          Flagged access events ({flagged.length})
        </h2>
        <div className="flex flex-col gap-2">
          {flagged.length === 0 && <p className="text-xs text-[#7488AA]">Nothing flagged right now.</p>}
          {flagged.slice(0, 8).map((e) => (
            <div key={e.id} className="text-xs border-b border-[#1C2740] last:border-0 py-2">
              <span className="text-[#C3CEE3] font-medium">{e.doctor.fullName}</span>
              <span className="text-[#7488AA]"> ({e.doctor.hospital.name}) opened {e.patient.fullName}&apos;s chart, {e.method === "EMERGENCY_OVERRIDE" ? "emergency override" : e.method.toLowerCase()}</span>
              <span className="text-[#7488AA]"> at {e.startedAt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#121A2C] rounded-xl border border-[#243149] shadow-sm p-5">
        <h2 className="text-sm font-semibold text-[#E7ECF5] mb-1">Research export</h2>
        <p className="text-xs text-[#7488AA] mb-3">
          A summary export with only counts and averages, built from patients who agreed to share
          data for research. No names, emails, or patient IDs are included.
        </p>
        <a
          href="/api/admin/research-export"
          className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white px-3 py-2 rounded-lg w-fit"
        >
          <Download size={13} /> Download JSON export
        </a>
      </div>
    </div>
  );
}
