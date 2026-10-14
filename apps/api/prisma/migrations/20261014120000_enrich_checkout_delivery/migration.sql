-- Enrich checkout: delivery details on orders
ALTER TABLE "orders" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingPostalCode" TEXT;
ALTER TABLE "orders" ADD COLUMN "addressLabel" TEXT;
ALTER TABLE "orders" ADD COLUMN "deliveryNotes" TEXT;
ALTER TABLE "orders" ADD COLUMN "deliverySpeed" TEXT NOT NULL DEFAULT 'STANDARD';
