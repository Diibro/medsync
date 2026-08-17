// Generates synthetic patients (MITRE Synthea) and loads them into the three HAPI FHIR servers
// standing in for hospitals — see docs/USAGE.md "Hospital data". Run via `npm run seed:hospitals`.
//
// For each hospital: skip if it already has data (HAPI's default H2 store is in-memory, so this is
// only needed again after a container restart, but running it twice should never duplicate data).
// Otherwise, run Synthea for a real US state/city (Synthea has no Nigeria/Lagos module — see
// docs/PROGRESS.md decisions log), then upload every generated bundle as-is EXCEPT a handful of
// patients per hospital, which get their `Patient.name` relabeled and a MedSync MRN `identifier`
// attached so the existing demo IDs (LUTH-0001 etc.) and hospital branding keep working.
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = path.join(ROOT, "docker", "synthea", "output");

// Must match src/lib/hospitals/connector.ts's MRN_SYSTEM constant.
const MRN_SYSTEM = "http://medsync.dev/mrn";

type DemoPatient = { fileIndex: number; mrn: string; given: string; family: string };
type HospitalConfig = {
  key: string;
  baseUrl: string;
  genState: string;
  genCity: string;
  population: number;
  demoPatients: DemoPatient[];
};

// Synthea's default demographics are US-only, so these are real US locations — see the note above.
// The same demo identity ("Adaeze Okonkwo") is planted at all three hospitals under different MRNs
// to preserve the "one person, records scattered across hospitals" story the demo walkthrough uses.
const HOSPITALS: HospitalConfig[] = [
  {
    key: "hospital-a",
    baseUrl: "http://localhost:5101/fhir",
    genState: "Massachusetts",
    genCity: "Boston",
    population: 25,
    demoPatients: [
      { fileIndex: 0, mrn: "LUTH-0001", given: "Adaeze", family: "Okonkwo" },
      { fileIndex: 1, mrn: "LUTH-0002", given: "Bola", family: "Adeyemi" },
    ],
  },
  {
    key: "hospital-b",
    baseUrl: "http://localhost:5102/fhir",
    genState: "Ohio",
    genCity: "Columbus",
    population: 20,
    demoPatients: [{ fileIndex: 0, mrn: "EKO-7781", given: "Adaeze", family: "Okonkwo" }],
  },
  {
    key: "hospital-c",
    baseUrl: "http://localhost:5103/fhir",
    genState: "Texas",
    genCity: "Austin",
    population: 20,
    demoPatients: [{ fileIndex: 0, mrn: "STN-3321", given: "Adaeze", family: "Okonkwo" }],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FhirBundle = Record<string, any>;

async function alreadyLoaded(hospital: HospitalConfig): Promise<boolean> {
  const demo = hospital.demoPatients[0];
  if (!demo) return false;
  try {
    const response = await fetch(
      `${hospital.baseUrl}/Patient?identifier=${encodeURIComponent(`${MRN_SYSTEM}|${demo.mrn}`)}`,
      { headers: { Accept: "application/fhir+json" } },
    );
    if (!response.ok) return false;
    const bundle: FhirBundle = await response.json();
    return (bundle.total ?? 0) > 0;
  } catch {
    return false;
  }
}

function generate(hospital: HospitalConfig) {
  const fhirDir = path.join(OUTPUT_ROOT, hospital.key, "fhir");
  if (existsSync(fhirDir) && readdirSync(fhirDir).some((f) => f.endsWith(".json"))) {
    console.log(`[${hospital.key}] already generated (${fhirDir}) — skipping Synthea, uploading existing bundles.`);
    return;
  }
  const outDir = path.join(OUTPUT_ROOT, hospital.key);
  mkdirSync(outDir, { recursive: true });
  console.log(`[${hospital.key}] generating ${hospital.population} synthetic patients (${hospital.genCity}, ${hospital.genState})...`);
  execFileSync(
    "docker",
    [
      "compose",
      "run",
      "--rm",
      "synthea",
      hospital.genState,
      hospital.genCity,
      "-p",
      String(hospital.population),
      "--exporter.fhir.export=true",
      `--exporter.baseDirectory=/synthea/output/${hospital.key}/`,
    ],
    { stdio: "inherit", cwd: ROOT },
  );
}

async function uploadWithRetry(baseUrl: string, bundle: FhirBundle, attempts = 3): Promise<Response | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/fhir+json" },
        body: JSON.stringify(bundle),
      });
    } catch (err) {
      if (attempt === attempts) {
        console.error(`  network error after ${attempts} attempts: ${err instanceof Error ? err.message : err}`);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return null;
}

function relabel(bundle: FhirBundle, demo: DemoPatient) {
  const patientEntry = bundle.entry?.find((e: FhirBundle) => e.resource?.resourceType === "Patient");
  if (!patientEntry) return;
  patientEntry.resource.name = [{ use: "official", family: demo.family, given: [demo.given] }];
  patientEntry.resource.identifier = [
    ...(patientEntry.resource.identifier ?? []),
    { system: MRN_SYSTEM, value: demo.mrn },
  ];
}

async function load(hospital: HospitalConfig) {
  const fhirDir = path.join(OUTPUT_ROOT, hospital.key, "fhir");
  if (!existsSync(fhirDir)) {
    console.error(`[${hospital.key}] no generated data found at ${fhirDir} — generation may have failed.`);
    return;
  }

  // Patient bundles reference Practitioner/Organization resources by conditional search (e.g.
  // `Practitioner?identifier=...`), which only resolves if those registry bundles were already
  // loaded — so hospitalInformation*/practitionerInformation* must go first, not alphabetically.
  const files = readdirSync(fhirDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => {
      const isSystemFile = (f: string) => f.startsWith("hospitalInformation") || f.startsWith("practitionerInformation");
      if (isSystemFile(a) !== isSystemFile(b)) return isSystemFile(a) ? -1 : 1;
      return a.localeCompare(b);
    });
  let patientFileIndex = 0;
  let uploaded = 0;

  for (const file of files) {
    const bundle: FhirBundle = JSON.parse(readFileSync(path.join(fhirDir, file), "utf-8"));
    const isPatientBundle = bundle.entry?.some((e: FhirBundle) => e.resource?.resourceType === "Patient");

    if (isPatientBundle) {
      const demo = hospital.demoPatients.find((d) => d.fileIndex === patientFileIndex);
      if (demo) relabel(bundle, demo);
      patientFileIndex++;
    }

    const response = await uploadWithRetry(hospital.baseUrl, bundle);
    if (!response) {
      console.error(`[${hospital.key}] failed to upload ${file}: no response after retries`);
      continue;
    }
    if (!response.ok) {
      console.error(`[${hospital.key}] failed to upload ${file}: ${response.status} ${await response.text()}`);
      continue;
    }
    uploaded++;
  }

  console.log(`[${hospital.key}] uploaded ${uploaded}/${files.length} bundles.`);
}

async function main() {
  for (const hospital of HOSPITALS) {
    if (await alreadyLoaded(hospital)) {
      console.log(`[${hospital.key}] already has demo data — skipping.`);
      continue;
    }
    generate(hospital);
    await load(hospital);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
