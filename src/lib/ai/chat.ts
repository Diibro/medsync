import "server-only";
import { GoogleGenAI } from "@google/genai";
import { formatPatientContext, type PatientContext } from "@/lib/ai/summary";

export type ChatTurn = { role: "user" | "assistant"; text: string };

const DOCTOR_CHAT_INSTRUCTIONS = `You are a clinical assistant answering a doctor's questions about the patient chart shown below,
or responding to a test/medication/action the doctor describes they're considering. Answer using
ONLY the patient data provided — if something isn't in the record, say you don't have that
information rather than guessing. Never tell the doctor what treatment to give or what decision to
make; only report relevant facts from the record (allergies, existing conditions, current
medications, confirmed conflicts) and flag anything that seems relevant to what they described, so
they can decide. Keep answers short and direct.`;

const PATIENT_CHAT_INSTRUCTIONS = `You are answering a patient's question about their own health record, shown below, in simple,
plain English — no jargon, or explain it briefly if you must use it. Answer using ONLY their own
record data provided — if something isn't in their record, say you don't have that information and
suggest they ask their doctor, rather than giving general medical advice. Be warm and brief.`;

async function chat(systemInstruction: string, context: PatientContext, history: ChatTurn[], question: string) {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const transcript = history.map((t) => `${t.role === "user" ? "Question" : "Answer"}: ${t.text}`).join("\n\n");
  const prompt = [
    `Patient record data:\n${formatPatientContext(context)}`,
    transcript ? `Conversation so far:\n${transcript}` : null,
    `New message: ${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: { systemInstruction, maxOutputTokens: 600 },
  });

  return response.text?.trim() || "I couldn't generate a response. Please try rephrasing.";
}

export async function chatAsDoctor(context: PatientContext, history: ChatTurn[], question: string) {
  return chat(DOCTOR_CHAT_INSTRUCTIONS, context, history, question);
}

export async function chatAsPatient(context: PatientContext, history: ChatTurn[], question: string) {
  return chat(PATIENT_CHAT_INSTRUCTIONS, context, history, question);
}
