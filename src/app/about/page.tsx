import Link from "next/link";
import { Heart, Target, Users, ShieldCheck, Brain, Globe2, Compass, Handshake, Stethoscope, Code2, BookOpen } from "lucide-react";
import { PageBackdrop } from "@/components/public/page-backdrop";
import { Reveal } from "@/components/public/reveal";
import { TeamTree, type TeamMember } from "@/components/public/team-tree";

const teamLead: TeamMember = { icon: Compass, name: "Terrance Ofori Tenkorang", role: "Team Lead", accent: "blue" };
const teamDeputy: TeamMember = { icon: Handshake, name: "Nkah Chambeline Dzengong", role: "Deputy Team Lead", accent: "amber" };
const teamMembers: TeamMember[] = [
  { icon: Stethoscope, name: "Benjamin Ishimwe", role: "Health Research Lead", accent: "amber" },
  { icon: Code2, name: "Ebimene Eli Agent", role: "Full-Stack Developer", accent: "blue" },
  { icon: BookOpen, name: "Hatangimana Samuel", role: "Documentation Lead", accent: "amber" },
  { icon: Brain, name: "Dushime Brother", role: "AI Engineer", accent: "blue" },
];

const values = [
  {
    icon: Target,
    title: "Your record follows you",
    desc: "Care shouldn't reset every time you walk into a different hospital. We built MedSync so your history moves with you, not with the building you happened to visit.",
    accent: "blue",
  },
  {
    icon: ShieldCheck,
    title: "You stay in control",
    desc: "Nothing is visible to a doctor until you approve it. Every access is logged, time-boxed, and visible back to you.",
    accent: "amber",
  },
  {
    icon: Brain,
    title: "AI as a second pair of eyes",
    desc: "We use AI to catch drug conflicts and read handwritten documents, always with a human confirming before anything is saved.",
    accent: "amber",
  },
  {
    icon: Globe2,
    title: "Built for real conditions",
    desc: "Not everyone has a smartphone or steady data. Emergency information is reachable over USSD from any basic phone.",
    accent: "blue",
  },
];

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col relative">
      <PageBackdrop />
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#E7ECF5]">MedSync</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/contact" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5] hidden sm:block">
            Contact
          </Link>
          <Link href="/" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full flex flex-col gap-14">
        <Reveal className="max-w-2xl flex flex-col gap-5">
          <span className="text-xs font-medium text-[#D8A05C] bg-[#241B0E] border border-[#3A2A16] rounded-full px-3 py-1 w-fit">
            About MedSync
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E7ECF5] leading-tight">
            One health record, built to travel with the patient
          </h1>
          <p className="text-[#93A2C0] leading-relaxed">
            MedSync is a decentralized, AI-assisted patient record platform. Instead of a
            history scattered across every hospital a patient has ever visited, MedSync keeps
            one record that the patient owns, links across hospitals, and shares with doctors
            only when the patient allows it.
          </p>
        </Reveal>

        <div>
          <h2 className="text-xl font-bold text-[#E7ECF5] mb-6">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 80}
                className="bg-[#121A2C] border border-[#243149] rounded-xl p-5 flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                    v.accent === "amber"
                      ? "bg-gradient-to-br from-[#3A2A16] to-[#241809] border-[#4A3D1E]"
                      : "bg-gradient-to-br from-[#152540] to-[#0F1830] border-[#243149]"
                  }`}
                >
                  <v.icon size={18} className={v.accent === "amber" ? "text-[#D8A05C]" : "text-[#7CA6E8]"} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#E7ECF5] mb-1.5">{v.title}</h3>
                  <p className="text-sm text-[#93A2C0] leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#E7ECF5] mb-1">The team</h2>
          <p className="text-sm text-[#93A2C0] mb-8">The people building MedSync, AB Group 3.</p>
          <TeamTree lead={teamLead} deputy={teamDeputy} members={teamMembers} />
        </div>

        <Reveal className="rounded-2xl bg-gradient-to-r from-[#1B3A6B] via-[#20447F] to-[#2A5298] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-white shrink-0" />
            <div>
              <p className="text-white font-semibold">Built for patients, doctors, and hospitals</p>
              <p className="text-blue-100 text-sm">A course project turned into a working platform, one milestone at a time.</p>
            </div>
          </div>
          <Link
            href="/contact"
            className="bg-white text-[#1B3A6B] hover:bg-blue-50 rounded-lg h-10 px-5 flex items-center text-sm font-medium shrink-0"
          >
            Get in touch
          </Link>
        </Reveal>
      </main>

      <footer className="px-6 py-8 border-t border-[#152030] mt-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#7488AA] text-xs">
            <Heart size={14} />
            MedSync
          </div>
          <div className="flex items-center gap-5 text-xs text-[#7488AA]">
            <Link href="/contact" className="hover:text-[#C3CEE3]">Contact</Link>
            <Link href="/login" className="hover:text-[#C3CEE3]">Sign in</Link>
            <Link href="/register" className="hover:text-[#C3CEE3]">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
