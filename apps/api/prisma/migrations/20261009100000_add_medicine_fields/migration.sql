-- AlterTable
ALTER TABLE "products" ADD COLUMN     "genericName" TEXT,
ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "strength" TEXT,
ADD COLUMN     "form" TEXT,
ADD COLUMN     "therapeuticClass" TEXT,
ADD COLUMN     "requiresRx" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packSize" TEXT;

-- CreateIndex
CREATE INDEX "products_therapeuticClass_idx" ON "products"("therapeuticClass");
