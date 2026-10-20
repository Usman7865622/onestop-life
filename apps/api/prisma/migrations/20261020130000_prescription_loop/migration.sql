-- Post-visit digital prescriptions (Phase 1C)

CREATE TABLE "prescriptions" (
    "id" "uuid" NOT NULL,
    "appointmentId" "uuid" NOT NULL,
    "patientId" "uuid" NOT NULL,
    "doctorProfileId" "uuid" NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prescriptions_appointmentId_key" ON "prescriptions"("appointmentId");
CREATE INDEX "prescriptions_patientId_createdAt_idx" ON "prescriptions"("patientId", "createdAt");
CREATE INDEX "prescriptions_doctorProfileId_createdAt_idx" ON "prescriptions"("doctorProfileId", "createdAt");

CREATE TABLE "prescription_items" (
    "id" "uuid" NOT NULL,
    "prescriptionId" "uuid" NOT NULL,
    "productId" "uuid",
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "durationDays" INTEGER,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Digital prescriptions can satisfy the checkout Rx gate on orders.
ALTER TABLE "orders" ADD COLUMN "prescriptionId" "uuid";
ALTER TABLE "orders" ADD CONSTRAINT "orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
