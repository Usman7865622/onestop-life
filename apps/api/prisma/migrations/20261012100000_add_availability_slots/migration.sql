-- Add AvailabilitySlot table for real doctor availability schedules
CREATE TABLE "availability_slots" (
    "id" "uuid" NOT NULL,
    "doctorProfileId" "uuid" NOT NULL,
    "facilityId" "uuid",
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "availability_slots_doctorProfileId_weekday_idx" ON "availability_slots"("doctorProfileId", "weekday");
