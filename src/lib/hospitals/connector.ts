import "server-only";
import type { RecordType } from "@/generated/prisma/enums";

// A real FHIR R4 client against each hospital's HAPI FHIR server (see docs/ARCHITECTURE.md §6 and
// docs/USAGE.md "Hospital data"). Patients are found by a MedSync-issued MRN identifier — see
// MRN_SYSTEM below, which must match scripts/load-hospital-data.ts exactly, since that script is
// what actually assigns this identifier to a handful of demo patients when seeding each hospital.
export type RemoteRecord = {
  type: RecordType;
  title: string;
  description?: string;
  doctorName?: string;
  occurredAt: string;
  tags?: string[];
  dosage?: string;
  duration?: string;
};

export type RemotePatientBundle = {
  externalId: string;
  fullName: string;
  records: RemoteRecord[];
};

export class HospitalConnectorError extends Error {}

// Must match scripts/load-hospital-data.ts's MRN_SYSTEM constant.
const MRN_SYSTEM = "http://medsync.dev/mrn";

function authHeaders(apiKey?: string | null): HeadersInit {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

async function fhirFetch(url: string, apiKey: string | null | undefined, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/fhir+json", ...authHeaders(apiKey), ...init?.headers },
    });
  } catch {
    throw new HospitalConnectorError("Could not reach the hospital's system. It may be offline.");
  }
}

type FhirResource = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function textFrom(codeableConcept: FhirResource | undefined, fallback: string): string {
  return codeableConcept?.text ?? codeableConcept?.coding?.[0]?.display ?? fallback;
}

function dateOnly(value?: string): string {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function humanName(name?: { prefix?: string[]; given?: string[]; family?: string }): string | undefined {
  if (!name) return undefined;
  return [name.prefix?.[0], name.given?.[0], name.family].filter(Boolean).join(" ") || undefined;
}

function resolvePractitionerName(
  practitioners: Map<string, string>,
  ref?: { reference?: string } | { actor?: { reference?: string } }[],
): string | undefined {
  const reference = Array.isArray(ref) ? ref[0]?.actor?.reference : ref?.reference;
  return reference ? practitioners.get(reference) : undefined;
}

async function findPatientId(baseUrl: string, externalId: string, apiKey?: string | null): Promise<string> {
  const response = await fhirFetch(
    `${baseUrl}/Patient?identifier=${encodeURIComponent(`${MRN_SYSTEM}|${externalId}`)}`,
    apiKey,
  );
  if (!response.ok) {
    throw new HospitalConnectorError(`The hospital's system returned an error (${response.status}).`);
  }
  const searchBundle = await response.json();
  const patientId: string | undefined = searchBundle.entry?.[0]?.resource?.id;
  if (!searchBundle.total || !patientId) {
    throw new HospitalConnectorError(
      "This hospital has no record of that patient ID. Double-check it with the hospital before linking.",
    );
  }
  return patientId;
}

function mapResourceToRecord(resource: FhirResource, practitioners: Map<string, string>): RemoteRecord | null {
  switch (resource.resourceType) {
    case "Condition":
      return {
        type: "DIAGNOSIS",
        title: textFrom(resource.code, "Diagnosis"),
        description: resource.note?.[0]?.text,
        doctorName: resolvePractitionerName(practitioners, resource.recorder ?? resource.asserter),
        occurredAt: dateOnly(resource.onsetDateTime ?? resource.recordedDate),
        tags: resource.category?.map((c: FhirResource) => textFrom(c, "")).filter(Boolean),
      };
    case "MedicationRequest": {
      const title = resource.medicationCodeableConcept
        ? textFrom(resource.medicationCodeableConcept, "Medication")
        : (resource.medicationReference?.display ?? "Medication");
      return {
        type: "PRESCRIPTION",
        title,
        description: resource.dosageInstruction?.[0]?.text,
        dosage: resource.dosageInstruction?.[0]?.text,
        doctorName: resolvePractitionerName(practitioners, resource.requester),
        occurredAt: dateOnly(resource.authoredOn),
      };
    }
    case "Observation": {
      // Only carry lab results into a patient's record — vitals arrive via MedSync's own
      // patient-logged Observations, so syncing hospital vital-signs too would just be noise.
      const isLab = resource.category?.some((c: FhirResource) =>
        c.coding?.some((coding: FhirResource) => coding.code === "laboratory"),
      );
      if (!isLab) return null;
      const value = resource.valueQuantity
        ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit ?? ""}`.trim()
        : (resource.valueString ?? resource.valueCodeableConcept?.text);
      return {
        type: "LAB_REPORT",
        title: textFrom(resource.code, "Lab result"),
        description: value ? `Result: ${value}` : undefined,
        doctorName: resolvePractitionerName(practitioners, resource.performer),
        occurredAt: dateOnly(resource.effectiveDateTime ?? resource.issued),
      };
    }
    case "Procedure":
      return {
        type: "PROCEDURE",
        title: textFrom(resource.code, "Procedure"),
        description: resource.note?.[0]?.text,
        doctorName: resolvePractitionerName(practitioners, resource.performer),
        occurredAt: dateOnly(resource.performedDateTime ?? resource.performedPeriod?.start),
      };
    case "Immunization":
      return {
        type: "VACCINATION",
        title: textFrom(resource.vaccineCode, "Vaccination"),
        doctorName: resolvePractitionerName(practitioners, resource.performer),
        occurredAt: dateOnly(resource.occurrenceDateTime),
      };
    default:
      return null;
  }
}

export async function fetchPatientBundle(
  baseUrl: string,
  externalId: string,
  apiKey?: string | null,
): Promise<RemotePatientBundle> {
  const patientId = await findPatientId(baseUrl, externalId, apiKey);

  const everythingResponse = await fhirFetch(`${baseUrl}/Patient/${patientId}/$everything`, apiKey);
  if (!everythingResponse.ok) {
    throw new HospitalConnectorError(`The hospital's system returned an error (${everythingResponse.status}).`);
  }
  const everythingBundle = await everythingResponse.json();
  const resources: FhirResource[] = (everythingBundle.entry ?? [])
    .map((entry: FhirResource) => entry.resource)
    .filter(Boolean);

  const patientResource = resources.find((r) => r.resourceType === "Patient" && r.id === patientId);
  const fullName = humanName(patientResource?.name?.[0]) ?? "Unknown";

  const practitioners = new Map<string, string>();
  for (const resource of resources) {
    if (resource.resourceType === "Practitioner") {
      const name = humanName(resource.name?.[0]);
      if (name) practitioners.set(`Practitioner/${resource.id}`, name);
    }
  }

  const records = resources
    .map((resource) => mapResourceToRecord(resource, practitioners))
    .filter((record): record is RemoteRecord => record !== null);

  return { externalId, fullName, records };
}

function buildFhirResource(patientId: string, record: RemoteRecord): FhirResource {
  const subject = { reference: `Patient/${patientId}` };
  switch (record.type) {
    case "DIAGNOSIS":
      return {
        resourceType: "Condition",
        subject,
        code: { text: record.title },
        recordedDate: record.occurredAt,
        note: record.description ? [{ text: record.description }] : undefined,
      };
    case "PRESCRIPTION":
      return {
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        subject,
        medicationCodeableConcept: { text: record.title },
        authoredOn: record.occurredAt,
        dosageInstruction: record.dosage ? [{ text: record.dosage }] : undefined,
      };
    case "LAB_REPORT":
      return {
        resourceType: "Observation",
        status: "final",
        subject,
        code: { text: record.title },
        effectiveDateTime: record.occurredAt,
        category: [
          {
            coding: [
              { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" },
            ],
          },
        ],
        valueString: record.description,
      };
    case "PROCEDURE":
      return {
        resourceType: "Procedure",
        status: "completed",
        subject,
        code: { text: record.title },
        performedDateTime: record.occurredAt,
        note: record.description ? [{ text: record.description }] : undefined,
      };
    case "VACCINATION":
      return {
        resourceType: "Immunization",
        status: "completed",
        patient: subject, // Immunization uses `patient`, not `subject` — the one FHIR field-name exception here.
        vaccineCode: { text: record.title },
        occurrenceDateTime: record.occurredAt,
      };
  }
}

/** Best-effort write-back after a doctor session — never throws to the caller. A real deployment
 * would hand this to a retried background job (see docs/ARCHITECTURE.md §7); here it retries once
 * inline, then gives up and lets the caller log the failure. The record always exists in MedSync's
 * own DB regardless of whether this succeeds — see docs/PROGRESS.md M11 notes. */
export async function pushRecordToHospital(
  baseUrl: string,
  externalId: string,
  record: RemoteRecord,
  apiKey?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const patientId = await findPatientId(baseUrl, externalId, apiKey);
      const resource = buildFhirResource(patientId, record);
      const response = await fetch(`${baseUrl}/${resource.resourceType}`, {
        method: "POST",
        headers: { "Content-Type": "application/fhir+json", ...authHeaders(apiKey) },
        body: JSON.stringify(resource),
      });
      if (response.ok) return { ok: true };
      if (attempt === 2) return { ok: false, error: `Hospital system returned ${response.status}.` };
    } catch (err) {
      if (attempt === 2) return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
  return { ok: false, error: "Unreachable." };
}
