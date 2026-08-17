"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecordCard } from "@/components/patient/record-card";
import type { RecordType } from "@/generated/prisma/enums";

type Record = Parameters<typeof RecordCard>[0]["record"];

const FILTERS: { value: string; label: string; type?: RecordType }[] = [
  { value: "all", label: "All Records" },
  { value: "diagnosis", label: "Diagnoses", type: "DIAGNOSIS" },
  { value: "prescription", label: "Prescriptions", type: "PRESCRIPTION" },
  { value: "report", label: "Lab Reports", type: "LAB_REPORT" },
];

export function RecordsTabs({ records }: { records: Record[] }) {
  const [tab, setTab] = useState("all");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4 bg-[#121A2C] border border-[#243149]">
        {FILTERS.map((f) => (
          <TabsTrigger key={f.value} value={f.value}>
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FILTERS.map((f) => {
        const filtered = f.type ? records.filter((r) => r.type === f.type) : records;
        return (
          <TabsContent key={f.value} value={f.value} className="mt-0">
            <div className="flex flex-col gap-2.5">
              {filtered.length === 0 && <p className="text-sm text-[#7488AA] py-12 text-center">No records in this category yet.</p>}
              {filtered.map((r) => (
                <RecordCard key={r.id} record={r} />
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
