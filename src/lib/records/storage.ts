import "server-only";
import { randomUUID } from "node:crypto";
import { put, get } from "@vercel/blob";
import { encryptBuffer, decryptBuffer } from "@/lib/security/file-encryption";

// Vercel Blob storage for uploaded documents, encrypted at rest (AES-256-GCM) before upload. Files
// are PHI, so blobs are private (require BLOB_READ_WRITE_TOKEN to fetch) and are only ever served
// through the authenticated, ownership-checked route handler at app/api/files/[...key]/route.ts.
const STORAGE_PREFIX = "uploads";

export async function saveUpload(patientId: string, fileName: string, buffer: Buffer) {
  const key = `${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storageKey = `${patientId}/${key}`;
  await put(`${STORAGE_PREFIX}/${storageKey}`, encryptBuffer(buffer), { access: "private" });
  return storageKey;
}

export async function readUpload(storageKey: string) {
  const blob = await get(`${STORAGE_PREFIX}/${storageKey}`, { access: "private" });
  if (!blob || !blob.stream) throw new Error(`Upload not found: ${storageKey}`);
  const encrypted = Buffer.from(await new Response(blob.stream).arrayBuffer());
  return decryptBuffer(encrypted);
}
