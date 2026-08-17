import "server-only";
import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids read-aloud ambiguity

// A short code a doctor can be told and type in to look up a patient — the in-app stand-in for
// what a QR code or portal-link payload would carry. See docs/ARCHITECTURE.md §3.
export function generatePublicCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export function generateNumericCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomInt(10).toString();
  }
  return code;
}
