-- Create enums if they don't exist
DO postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('okta', 'google', 'local');
EXCEPTION
  WHEN duplicate_object THEN null;
END postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require;

DO postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require;

DO postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require BEGIN
  CREATE TYPE "PickStatus" AS ENUM ('pending', 'won', 'lost', 'pushed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require;

DO postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require BEGIN
  CREATE TYPE "SquadMemberRole" AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require;

DO postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require;

-- Fix columns to use the enums properly
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE "AuthProvider" USING "authProvider"::"AuthProvider";
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus" USING "status"::"UserStatus";
ALTER TABLE "PickSet" ALTER COLUMN "status" TYPE "PickStatus" USING "status"::"PickStatus";
ALTER TABLE "Pick" ALTER COLUMN "status" TYPE "PickStatus" USING "status"::"PickStatus";
ALTER TABLE "SquadMember" ALTER COLUMN "role" TYPE "SquadMemberRole" USING "role"::"SquadMemberRole";
ALTER TABLE "SquadPayment" ALTER COLUMN "status" TYPE "PaymentStatus" USING "status"::"PaymentStatus";
