/*
  Warnings:

  - Made the column `image` on table `Contact` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "image" SET NOT NULL,
ALTER COLUMN "image" DROP DEFAULT,
ALTER COLUMN "image" SET DATA TYPE TEXT;
