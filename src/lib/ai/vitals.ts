import { z } from "zod";
import type { ObservationType } from "@/generated/prisma/enums";

export const VITALS_CONFIG: Record<ObservationType, { label: string; unit: string; placeholder: string }> = {
  BLOOD_PRESSURE: { label: "Blood Pressure (systolic)", unit: "mmHg", placeholder: "e.g. 128" },
  BLOOD_GLUCOSE: { label: "Blood Glucose", unit: "mg/dL", placeholder: "e.g. 104" },
  BMI: { label: "BMI", unit: "kg/m²", placeholder: "e.g. 24.1" },
  CHOLESTEROL: { label: "Total Cholesterol", unit: "mg/dL", placeholder: "e.g. 198" },
};

export const vitalsSchema = z.object({
  type: z.enum(["BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BMI", "CHOLESTEROL"]),
  value: z.coerce.number().positive("Enter a positive number."),
  note: z.string().trim().optional(),
});
