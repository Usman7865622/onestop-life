-- Advanced checkout: delivery slot + gift wrap on orders
ALTER TABLE "orders" ADD COLUMN "deliverySlot" TEXT;
ALTER TABLE "orders" ADD COLUMN "giftWrap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "giftMessage" TEXT;
