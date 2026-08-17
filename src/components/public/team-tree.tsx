import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/public/reveal";

export type TeamMember = {
  icon: LucideIcon;
  name: string;
  role: string;
  accent: "blue" | "amber";
};

function NodeCard({ member, size }: { member: TeamMember; size: "lg" | "md" | "sm" }) {
  const isAmber = member.accent === "amber";
  const avatarSize = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-11 h-11" : "w-14 h-14";
  const iconSize = size === "lg" ? 26 : size === "sm" ? 18 : 22;

  return (
    <div className="flex flex-col items-center text-center gap-2 w-32 sm:w-40">
      <div
        className={`${avatarSize} rounded-full border-2 flex items-center justify-center shrink-0 ${
          isAmber
            ? "bg-gradient-to-br from-[#3A2A16] to-[#241809] border-[#4A3D1E]"
            : "bg-gradient-to-br from-[#152540] to-[#0F1830] border-[#2A4270]"
        } ${
          size === "lg"
            ? isAmber
              ? "ring-2 ring-offset-2 ring-offset-[#0B1220] ring-[#D8A05C]/40"
              : "ring-2 ring-offset-2 ring-offset-[#0B1220] ring-[#3D6FC4]/40"
            : ""
        }`}
      >
        <member.icon size={iconSize} className={isAmber ? "text-[#D8A05C]" : "text-[#7CA6E8]"} />
      </div>
      <div>
        <p className={`font-semibold text-[#E7ECF5] leading-tight ${size === "lg" ? "text-sm" : "text-xs sm:text-sm"}`}>
          {member.name}
        </p>
        <p className="text-[11px] sm:text-xs text-[#93A2C0]">{member.role}</p>
      </div>
    </div>
  );
}

export function TeamTree({ lead, deputy, members }: { lead: TeamMember; deputy: TeamMember; members: TeamMember[] }) {
  return (
    <div className="flex flex-col items-center">
      <Reveal delay={0}>
        <NodeCard member={lead} size="lg" />
      </Reveal>

      <div className="w-px h-8 bg-[#243149]" />

      <Reveal delay={150}>
        <NodeCard member={deputy} size="md" />
      </Reveal>

      <div className="w-px h-8 bg-[#243149]" />

      <div className="relative w-full max-w-2xl">
        <div className="absolute top-0 left-[25%] right-[25%] sm:left-[12.5%] sm:right-[12.5%] h-px bg-[#243149]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-8 pt-8">
          {members.map((m, i) => (
            <div key={m.name} className="relative flex flex-col items-center">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-[#243149]" />
              <Reveal delay={300 + i * 80}>
                <NodeCard member={m} size="sm" />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
