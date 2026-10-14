-- Next-level checkout: returns, EMI plan, address book, wallet
ALTER TABLE "orders" ADD COLUMN "emiPlan" TEXT;
ALTER TABLE "orders" ADD COLUMN "returnRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "returnReason" TEXT;
ALTER TABLE "orders" ADD COLUMN "returnRequestedAt" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN "walletBalanceMinor" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "addresses" (
    "id" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wallet_transactions" (
    "id" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wallet_transactions_userId_createdAt_idx" ON "wallet_transactions"("userId", "createdAt");

ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
