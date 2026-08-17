import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guard";
import { buildResearchExport } from "@/lib/admin/export";
import { writeAudit } from "@/lib/audit/log";

// Route Handler because this is a file download navigated to directly, not a Server Action call
// from our own UI. See docs/ARCHITECTURE.md §2.
export async function GET() {
  const { staff } = await requirePlatformAdmin();
  const data = await buildResearchExport();

  await writeAudit({ actorId: staff.id, actorRole: "PLATFORM_ADMIN", action: "admin.research_export.downloaded" });

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="medsync-research-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
