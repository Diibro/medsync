import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const draftSchema = z.object({
  type: z.enum(["DIAGNOSIS", "PRESCRIPTION", "LAB_REPORT", "PROCEDURE", "VACCINATION"]),
  title: z.string().min(1),
  description: z.string().optional(),
  doctorName: z.string().optional(),
  occurredAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type OcrDraft = z.infer<typeof draftSchema>;

const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function isOcrConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function isOcrSupportedMimeType(mimeType: string) {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

const EXTRACTION_PROMPT = `Extract this medical document into the JSON shape given by the response schema.
Pick the single "type" that best matches the document's primary content. If a field isn't present in the document, omit it (or use [] for tags). This is a draft a patient will review and edit before it's saved — extract faithfully, don't infer clinical conclusions the document doesn't state.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      format: "enum",
      enum: ["DIAGNOSIS", "PRESCRIPTION", "LAB_REPORT", "PROCEDURE", "VACCINATION"],
    },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    doctorName: { type: Type.STRING },
    occurredAt: { type: Type.STRING, description: "YYYY-MM-DD" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["type", "title"],
};

/** Calls Gemini with vision to turn an uploaded document photo/PDF into a structured draft. Never
 * writes to the database itself — the caller is responsible for treating the result as a draft
 * requiring human confirmation. See docs/ARCHITECTURE.md §4 and docs/USAGE.md "AI setup". */
export async function extractRecordDraft(buffer: Buffer, mimeType: string): Promise<OcrDraft> {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ text: EXTRACTION_PROMPT }, { inlineData: { mimeType, data: buffer.toString("base64") } }],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("OCR response contained no text.");
  }

  return draftSchema.parse(JSON.parse(response.text));
}
