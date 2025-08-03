/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `Agribusiness` table. All the data in the column will be lost.
  - You are about to drop the column `businessType` on the `Agribusiness` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `Agribusiness` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `Agribusiness` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `Agribusiness` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - Added the required column `country` to the `Agribusiness` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryCropCategory` to the `Agribusiness` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Agribusiness` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradingType` to the `Agribusiness` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KYBStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_RESUBMISSION');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'EXPIRED');

-- AlterTable
ALTER TABLE "Agribusiness" DROP COLUMN "businessAddress",
DROP COLUMN "businessType",
DROP COLUMN "registrationNumber",
DROP COLUMN "taxId",
DROP COLUMN "verificationStatus",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "businessImage" TEXT,
ADD COLUMN     "contactNo" TEXT,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "kybStatus" "KYBStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ADD COLUMN     "primaryCropCategory" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "tradingType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
DROP COLUMN "profileImage";

-- CreateTable
CREATE TABLE "FrequentlyAskedQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,

    CONSTRAINT "FrequentlyAskedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYBForm" (
    "id" TEXT NOT NULL,
    "agribusinessId" TEXT NOT NULL,
    "businessRegistrationNumber" TEXT,
    "businessAddress" TEXT NOT NULL,
    "taxId" TEXT,
    "businessLicense" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KYBForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "agribusinessId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "cropCategory" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasurement" TEXT NOT NULL,
    "minimumOrderQuantity" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "pricing" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RM',
    "allowBidding" BOOLEAN NOT NULL DEFAULT false,
    "storageConditions" TEXT,
    "expiryDate" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "productImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shippingMethod" TEXT,
    "directShippingCost" DECIMAL(10,2),
    "selectedLogistics" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KYBForm_agribusinessId_key" ON "KYBForm"("agribusinessId");

-- CreateIndex
CREATE INDEX "Product_agribusinessId_idx" ON "Product"("agribusinessId");

-- CreateIndex
CREATE INDEX "Product_cropCategory_idx" ON "Product"("cropCategory");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- AddForeignKey
ALTER TABLE "KYBForm" ADD CONSTRAINT "KYBForm_agribusinessId_fkey" FOREIGN KEY ("agribusinessId") REFERENCES "Agribusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_agribusinessId_fkey" FOREIGN KEY ("agribusinessId") REFERENCES "Agribusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;
