import Link from "next/link";
import { Heart, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageBackdrop } from "@/components/public/page-backdrop";
import { Reveal } from "@/components/public/reveal";

export default function ContactPage() {
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
          <Link href="/about" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5] hidden sm:block">
            About
          </Link>
          <Link href="/" className="text-sm text-[#93A2C0] hover:text-[#E7ECF5]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-10">
        <Reveal className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E7ECF5] mb-3">Need a hand?</h1>
            <p className="text-[#93A2C0] leading-relaxed">
              If something on MedSync is confusing or not working the way you expect, send us a
              message. A real person on the team reads every one.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#152540] flex items-center justify-center shrink-0">
                <Mail size={16} className="text-[#7CA6E8]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#E7ECF5]">Prefer email</p>
                <p className="text-sm text-[#93A2C0]">support@medsync.dev</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#152540] flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#7CA6E8]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#E7ECF5]">Response time</p>
                <p className="text-sm text-[#93A2C0]">Usually within a day</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-3">
          <ContactForm />
        </Reveal>
      </main>
    </div>
  );
}
