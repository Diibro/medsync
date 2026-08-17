-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "agreementNotes" TEXT,
ADD COLUMN     "agreementSignedAt" TIMESTAMP(3),
ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "connectionNotes" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "parentHospitalId" TEXT,
ADD COLUMN     "syncEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_parentHospitalId_fkey" FOREIGN KEY ("parentHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
