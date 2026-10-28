-- Family profiles (PR 1): household patient profiles under one account.

-- Every existing account is backfilled with exactly one "Myself" (isSelf) profile below.

-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('SELF', 'CHILD', 'PARENT', 'SPOUSE', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" "FamilyRelationship" NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_members_userId_deletedAt_idx" ON "family_members"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one self profile per account (enforced for app-level creates too)
CREATE UNIQUE INDEX "family_members_one_self_per_account" ON "family_members"("userId") WHERE "isSelf";

-- Backfill: one "Myself" profile per existing account, named from the account name when present
INSERT INTO "family_members" ("id", "userId", "fullName", "relationship", "isSelf", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", COALESCE(NULLIF(BTRIM("name"), ''), 'Myself'), 'SELF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users";
