"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { loginWithCredentials } from "@/lib/identity/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageBackdrop } from "@/components/public/page-backdrop";
import { PulseLine } from "@/components/public/pulse-line";
import { Reveal } from "@/components/public/reveal";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginWithCredentials, undefined);

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 py-16 overflow-hidden">
      <PageBackdrop />
      <PulseLine className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16" color="#3D6FC4" opacity={0.16} duration={8} />

      <Reveal className="w-full max-w-sm bg-[#121A2C]/90 backdrop-blur-sm rounded-xl border border-[#243149] shadow-lg shadow-black/20 p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-11 h-11 bg-gradient-to-br from-[#7CA6E8] to-[#3D6FC4] rounded-xl flex items-center justify-center ring-4 ring-[#3D6FC4]/15">
            <Heart size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#E7ECF5]">Sign in to MedSync</h1>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-10"
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-xs text-[#93A2C0] text-center">
          New patient?{" "}
          <Link href="/register" className="text-[#7CA6E8] hover:underline">
            Create an account
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
