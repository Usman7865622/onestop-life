-- OAuth: store the Google subject id for "Continue with Google" sign-in.
ALTER TABLE "users" ADD COLUMN "googleSub" TEXT;

CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");
