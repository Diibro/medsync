-- CreateEnum
CREATE TYPE "InsightKind" AS ENUM ('DRUG_CONFLICT', 'TREND');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'NOT_CONFIGURED');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BMI', 'CHOLESTEROL');

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" "InsightKind" NOT NULL,
    "severity" TEXT,
    "payload" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrJob" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "OcrStatus" NOT NULL,
    "draft" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OcrJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ObservationType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OcrJob_documentId_key" ON "OcrJob"("documentId");

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrJob" ADD CONSTRAINT "OcrJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
