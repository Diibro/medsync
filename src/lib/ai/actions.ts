"use server";

import { z } from "zod";
import { requirePatient } from "@/lib/auth/guard";
import { requireActiveAccessGrant } from "@/lib/access/guard";
import { buildPatientContext } from "@/lib/ai/context";
import { chatAsDoctor, chatAsPatient, type ChatTurn } from "@/lib/ai/chat";
import { isTransientAiError } from "@/lib/ai/summary";

export type ChatState = { reply?: string; error?: string } | undefined;

const chatSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20),
});

// Never surface the raw provider error to the client — it can leak implementation details (which
// LLM, quota/billing text) and usually isn't meaningful to a doctor or patient anyway.
function chatErrorMessage(context: string, err: unknown): string {
  if (isTransientAiError(err)) {
    console.warn(`${context}: AI temporarily rate-limited/overloaded.`);
    return "The AI assistant is busy right now. Please try again in a moment.";
  }
  console.error(`${context} failed:`, err);
  return "The AI assistant is unavailable right now. Please try again shortly.";
}

export async function askDoctorQuestion(accessEventId: string, history: ChatTurn[], question: string): Promise<ChatState> {
  const parsed = chatSchema.safeParse({ question, history });
  if (!parsed.success) return { error: "Please enter a question." };

  const { grant } = await requireActiveAccessGrant(accessEventId);
  const context = await buildPatientContext(grant.patientId);

  try {
    const reply = await chatAsDoctor(context, parsed.data.history, parsed.data.question);
    return { reply };
  } catch (err) {
    return { error: chatErrorMessage("askDoctorQuestion", err) };
  }
}

export async function askPatientQuestion(history: ChatTurn[], question: string): Promise<ChatState> {
  const parsed = chatSchema.safeParse({ question, history });
  if (!parsed.success) return { error: "Please enter a question." };

  const { patient } = await requirePatient();
  const context = await buildPatientContext(patient.id);

  try {
    const reply = await chatAsPatient(context, parsed.data.history, parsed.data.question);
    return { reply };
  } catch (err) {
    return { error: chatErrorMessage("askPatientQuestion", err) };
  }
}
