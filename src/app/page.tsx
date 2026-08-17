import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  Users,
  Brain,
  Building2,
  Smartphone,
  Lock,
  Clock,
  ArrowRight,
  Stethoscope,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageBackdrop } from "@/components/public/page-backdrop";
import { Reveal } from "@/components/public/reveal";

const features = [
  {
    icon: Users,
    title: "One record, every hospital",
    desc: "Add a record once and it stays with you. Visit a different hospital next month and your history is already there.",
    accent: "blue",
  },
  {
    icon: Brain,
    title: "AI that checks your prescriptions",
    desc: "The moment a doctor opens your chart, we check new prescriptions against what you already take and any allergies on file.",
    accent: "amber",
  },
  {
    icon: ShieldCheck,
    title: "You decide who sees it",
    desc: "A doctor needs a code you read out loud before they can see anything. Every visit to your file is logged and visible to you.",
    accent: "blue",
  },
  {
    icon: Building2,
    title: "Hospitals stay connected",
    desc: "Link your account to a hospital once and new visits sync in automatically, no more carrying folders of paper.",
    accent: "blue",
  },
  {
    icon: Smartphone,
    title: "Works without a smartphone",
    desc: "Check your blood type and allergies from any basic phone through USSD, no app or data plan needed.",
    accent: "amber",
  },
  {
    icon: Lock,
    title: "Built to be safe",
    desc: "Documents are encrypted, access attempts are rate limited, and every action is written to a permanent log.",
    accent: "blue",
  },
];

const steps = [
  { icon: FileText, title: "Add your history", desc: "Type in past diagnoses and prescriptions, or upload a photo and let AI read it for you." },
  { icon: Stethoscope, title: "Share a code with your doctor", desc: "Show them your access code. They ask for it, you read it out loud, and their session opens." },
  { icon: CheckCircle2, title: "Care that keeps up", desc: "Your doctor sees your full history and AI checks for conflicts before anything is prescribed." },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "DOCTOR" ? "/doctor" : "/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col relative">
      <PageBackdrop />
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#E7ECF5]">MedSync</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5] hidden sm:block">
            About
          </Link>
          <Link href="/contact" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5] hidden sm:block">
            Contact
          </Link>
          <Link href="/login" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5]">
            Sign in
          </Link>
          <Button render={<Link href="/register" />} size="sm" className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0">
            Get started
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(61,111,196,0.35), transparent)" }}
        />
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <Reveal>
            <span className="text-xs font-medium text-[#7CA6E8] bg-[#152540] border border-[#243149] rounded-full px-3 py-1">
              Built for patients, doctors, and hospitals
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#E7ECF5] leading-tight">
              Your health record,{" "}
              <span className="bg-gradient-to-r from-[#7CA6E8] to-[#3D6FC4] bg-clip-text text-transparent">
                wherever you go
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg text-[#93A2C0] max-w-xl">
              MedSync keeps your medical history in one place and follows you from hospital to
              hospital. Doctors get the full picture in seconds. You stay in control of who sees it.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Button render={<Link href="/register" />} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-11 gap-2 px-6">
                Create a patient account <ArrowRight size={16} />
              </Button>
              <Button render={<Link href="/contact" />} variant="outline" className="border-[#3D5A8A]/40 text-[#C3CEE3] h-11 px-6">
                Talk to us
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What it is */}
      <section className="px-6 py-14 border-t border-[#152030]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <h2 className="text-2xl font-bold text-[#E7ECF5] mb-4">What MedSync actually does</h2>
            <p className="text-[#93A2C0] leading-relaxed mb-4">
              Right now, your medical history lives in whichever hospital wrote it down. Change
              hospitals and you start from zero, again. Doctors ask you to remember details from
              years ago, and mistakes happen when memory is the only record.
            </p>
            <p className="text-[#93A2C0] leading-relaxed">
              MedSync flips that around. Your record belongs to you, not to one building. It travels
              with you, and any doctor you approve can read it the moment they need to, complete
              with the AI checks that catch what a rushed glance might miss.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-3">
            {steps.map((step, i) => (
              <Reveal
                key={step.title}
                delay={i * 100}
                className="flex items-start gap-4 bg-[#121A2C] border border-[#243149] rounded-xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#152540] to-[#0F1830] border border-[#243149] flex items-center justify-center shrink-0">
                  <step.icon size={16} className="text-[#7CA6E8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#E7ECF5]">{i + 1}. {step.title}</p>
                  <p className="text-xs text-[#93A2C0] mt-0.5">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-14 border-t border-[#152030] bg-[#0A0F1C]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#E7ECF5] mb-2">What&apos;s included</h2>
            <p className="text-[#93A2C0]">Everything built around one idea: your record should work for you.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 3) * 90}
                className="bg-[#121A2C] border border-[#243149] rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#3D5A8A]"
              >
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${
                    f.accent === "amber"
                      ? "bg-gradient-to-br from-[#3A2A16] to-[#241809] border-[#4A3D1E]"
                      : "bg-gradient-to-br from-[#152540] to-[#0F1830] border-[#243149]"
                  }`}
                >
                  <f.icon size={18} className={f.accent === "amber" ? "text-[#D8A05C]" : "text-[#7CA6E8]"} />
                </div>
                <h3 className="text-sm font-semibold text-[#E7ECF5] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#93A2C0] leading-relaxed">{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why use it */}
      <section className="px-6 py-14 border-t border-[#152030]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Reveal className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-[#E7ECF5] mb-3">Why people use it</h2>
            <p className="text-[#93A2C0] leading-relaxed">
              Less time repeating your history. Less money spent on tests you already did. Fewer
              mistakes from a doctor working with half the picture.
            </p>
          </Reveal>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "No more waiting rooms full of repeat tests", desc: "If a hospital already ran a test, the next one can see the result instead of running it again.", accent: "blue" },
              { icon: Heart, title: "Faster care in an emergency", desc: "Blood type, allergies, and conditions are visible immediately, before any forms are filled out.", accent: "amber" },
              { icon: Brain, title: "A second check on every prescription", desc: "AI compares a new prescription against your history and flags a conflict before it becomes a problem.", accent: "amber" },
              { icon: ShieldCheck, title: "Nothing happens without your knowledge", desc: "You can see exactly which doctor opened your file, when, and for how long.", accent: "blue" },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${b.accent === "amber" ? "bg-[#2A1E10]" : "bg-[#152540]"}`}>
                  <b.icon size={15} className={b.accent === "amber" ? "text-[#D8A05C]" : "text-[#7CA6E8]"} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E7ECF5]">{b.title}</p>
                  <p className="text-xs text-[#93A2C0] mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-t border-[#152030]">
        <Reveal className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-r from-[#1B3A6B] via-[#20447F] to-[#2A5298] p-10 text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Set up your record in a few minutes</h2>
          <p className="text-blue-100 max-w-md">
            Free for patients. No smartphone required to get emergency help through USSD.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Button render={<Link href="/register" />} className="bg-white text-[#1B3A6B] hover:bg-blue-50 border-0 h-11 px-6">
              Create a patient account
            </Button>
            <Button render={<Link href="/contact" />} variant="outline" className="border-white/30 text-white hover:bg-white/10 h-11 px-6">
              Ask a question first
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="px-6 py-8 border-t border-[#152030]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#7488AA] text-xs">
            <Heart size={14} />
            MedSync
          </div>
          <div className="flex items-center gap-5 text-xs text-[#7488AA]">
            <Link href="/about" className="hover:text-[#C3CEE3]">About</Link>
            <Link href="/contact" className="hover:text-[#C3CEE3]">Contact</Link>
            <Link href="/login" className="hover:text-[#C3CEE3]">Sign in</Link>
            <Link href="/register" className="hover:text-[#C3CEE3]">Create account</Link>
          </div>
          <p className="text-xs text-[#7488AA]">Doctor and hospital staff accounts are set up by the MedSync team.</p>
        </div>
      </footer>
    </div>
  );
}
