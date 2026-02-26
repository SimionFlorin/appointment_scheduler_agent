-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('GEMINI', 'OPENAI');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "aiProvider" "AIProvider" NOT NULL DEFAULT 'GEMINI';
