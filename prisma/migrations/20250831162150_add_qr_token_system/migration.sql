-- CreateEnum
CREATE TYPE "public"."PromoTokenStatus" AS ENUM ('ISSUED', 'REDEEMED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."RedemptionResult" AS ENUM ('APPROVED', 'DUPLICATE', 'EXPIRED', 'INACTIVE', 'OUT_OF_CAP', 'REVOKED');

-- AlterTable
ALTER TABLE "public"."Redemption" ADD COLUMN     "reason" TEXT,
ADD COLUMN     "result" "public"."RedemptionResult" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "public"."PromoToken" (
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."PromoTokenStatus" NOT NULL DEFAULT 'ISSUED',
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "PromoToken_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "PromoToken_promoId_userId_idx" ON "public"."PromoToken"("promoId", "userId");

-- CreateIndex
CREATE INDEX "PromoToken_status_expiresAt_idx" ON "public"."PromoToken"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "public"."PromoToken" ADD CONSTRAINT "PromoToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoToken" ADD CONSTRAINT "PromoToken_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "public"."Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
