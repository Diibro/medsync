"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendContactMessage } from "@/lib/support/actions";
import { Send } from "lucide-react";

const TOPIC_LABELS: Record<string, string> = {
  "how-it-works": "How the platform works",
  account: "Trouble with my account",
  hospital: "Linking a hospital",
  "doctor-access": "A doctor accessing my records",
  other: "Something else",
};

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, undefined);

  if (state?.success) {
    return (
      <div className="bg-[#121A2C] border border-[#243149] rounded-2xl p-8 text-center">
        <p className="text-lg font-semibold text-[#E7ECF5] mb-2">Message sent</p>
        <p className="text-sm text-[#93A2C0]">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="bg-[#121A2C] border border-[#243149] rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="So we can call you back if needed" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="topic">What do you need help with</Label>
        <Select name="topic" defaultValue="how-it-works">
          <SelectTrigger id="topic">
            <SelectValue>{(value: string) => TOPIC_LABELS[value] ?? value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="how-it-works">How the platform works</SelectItem>
            <SelectItem value="account">Trouble with my account</SelectItem>
            <SelectItem value="hospital">Linking a hospital</SelectItem>
            <SelectItem value="doctor-access">A doctor accessing my records</SelectItem>
            <SelectItem value="other">Something else</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Your message</Label>
        <Textarea id="message" name="message" rows={5} className="resize-none" placeholder="Tell us what's going on and we'll help you sort it out." required />
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}

      <Button type="submit" disabled={pending} className="bg-gradient-to-r from-[#1B3A6B] to-[#3D6FC4] hover:from-[#15294d] hover:to-[#2f5aad] text-white border-0 h-11 gap-2 w-fit">
        <Send size={15} />
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
