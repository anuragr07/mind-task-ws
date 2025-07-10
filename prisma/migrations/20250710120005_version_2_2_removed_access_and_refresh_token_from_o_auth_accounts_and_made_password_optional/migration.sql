/*
  Warnings:

  - You are about to drop the column `accessToken` on the `oauth_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `oauth_accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "oauth_accounts" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
