import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

// Captures the caller's IP and user agent automatically so every call site doesn't have to thread
// them through — headers() is available in Server Actions, Route Handlers, and Server Components
// alike. Falls back quietly if it's ever called somewhere without request context.
async function requestContext() {
  try {
    const list = await headers();
    const forwardedFor = list.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || list.get("x-real-ip") || null;
    return { ipAddress, userAgent: list.get("user-agent") };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export async function writeAudit(entry: {
  actorId: string;
  actorRole: Role;
  action: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { ipAddress, userAgent } = await requestContext();
  return db.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      targetId: entry.targetId,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      ipAddress,
      userAgent,
    },
  });
}
