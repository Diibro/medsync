"use client";

import { useEffect, useRef } from "react";
import { markRecordsViewed } from "@/lib/access/actions";

export function ViewTracker({ accessEventId, recordIds }: { accessEventId: string; recordIds: string[] }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || recordIds.length === 0) return;
    done.current = true;
    markRecordsViewed(accessEventId, recordIds);
  }, [accessEventId, recordIds]);

  return null;
}
