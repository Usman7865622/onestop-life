-- Rx prescription gating: orders containing prescription medicines carry a
-- prescription document key (file storage comes later, mirroring
-- VerificationRequest.documentKey) plus a pharmacist review status.
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "requiresRx" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prescriptionKey" TEXT,
ADD COLUMN     "prescriptionStatus" "PrescriptionStatus",
ADD COLUMN     "prescriptionNotes" TEXT,
ADD COLUMN     "prescriptionReviewedAt" TIMESTAMP(3);
