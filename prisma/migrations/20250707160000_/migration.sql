/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - Added the required column `address` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EnumRole" AS ENUM ('USER', 'ADMIN');

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "password",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "nonce" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "EnumRole" NOT NULL DEFAULT 'USER',
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("address");
