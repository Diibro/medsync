"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type FormState = { error?: string; success?: string } | undefined;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Enter a phone number we can reach you on."),
  topic: z.string().trim().min(1, "Pick a topic."),
  message: z.string().trim().min(10, "Tell us a bit more, at least 10 characters."),
});

export async function sendContactMessage(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const rateLimit = checkRateLimit(`contact:${parsed.data.email}`, { max: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return { error: "You've sent a few messages already. Try again later or email us directly." };
  }

  await db.contactMessage.create({ data: parsed.data });

  return { success: "Thanks, we got your message. We usually reply within a day." };
}

export async function markContactResolved(id: string) {
  await requirePlatformAdmin();
  await db.contactMessage.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } });
  revalidatePath("/admin/platform/support");
}
