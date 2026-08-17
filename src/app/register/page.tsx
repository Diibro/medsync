"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { registerPatient } from "@/lib/identity/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageBackdrop } from "@/components/public/page-backdrop";
import { PulseLine } from "@/components/public/pulse-line";
import { Reveal } from "@/components/public/reveal";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerPatient, undefined);

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-16 overflow-hidden">
      <PageBackdrop />
      <PulseLine className="absolute inset-x-0 top-20 h-14" color="#3D6FC4" opacity={0.14} duration={9} />
      <PulseLine className="absolute inset-x-0 bottom-16 h-14" color="#D8A05C" opacity={0.14} duration={7.5} />

      <Reveal className="w-full max-w-sm bg-[#121A2C]/90 backdrop-blur-sm rounded-xl border border-[#243149] shadow-lg shadow-black/20 p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-11 h-11 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-xl flex items-center justify-center ring-4 ring-[#3D6FC4]/15">
            <Heart size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#E7ECF5]">Create your patient account</h1>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            <p className="text-xs text-[#7488AA]">At least 8 characters.</p>
          </div>

          {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-10"
          >
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-xs text-[#93A2C0] text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[#7CA6E8] hover:underline">
            Sign in
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
