/*
  Warnings:

  - You are about to drop the column `replacedByToken` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revoked` on the `refresh_tokens` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `oauth_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "oauth_accounts" DROP COLUMN "expiresAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "replacedByToken",
DROP COLUMN "revoked";
