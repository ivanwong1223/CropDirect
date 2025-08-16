-- AlterTable
ALTER TABLE "BusinessBuyer" ADD COLUMN     "businessImage" TEXT,
ADD COLUMN     "contactNo" TEXT,
ALTER COLUMN "companyAddress" DROP NOT NULL;
