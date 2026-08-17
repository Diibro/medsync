import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { encryptBuffer, decryptBuffer } from "@/lib/security/file-encryption";

// Local-disk storage for uploaded documents, encrypted at rest (AES-256-GCM) — good enough for
// dev/demo. Files are PHI, so they're never placed under public/; they're only ever served through
// the authenticated, ownership-checked route handler at app/api/files/[...key]/route.ts. Swapping
// this for S3/GCS (with server-side encryption) later only touches this file.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

export async function saveUpload(patientId: string, fileName: string, buffer: Buffer) {
  const dir = path.join(STORAGE_ROOT, patientId);
  await mkdir(dir, { recursive: true });
  const key = `${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(dir, key), encryptBuffer(buffer));
  return `${patientId}/${key}`;
}

export async function readUpload(storageKey: string) {
  const encrypted = await readFile(path.join(STORAGE_ROOT, storageKey));
  return decryptBuffer(encrypted);
}
