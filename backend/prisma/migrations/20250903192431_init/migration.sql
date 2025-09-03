-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('okta');

-- CreateEnum
CREATE TYPE "public"."PickSetStatus" AS ENUM ('draft', 'submitted', 'locked');

-- CreateEnum
CREATE TYPE "public"."PickChoice" AS ENUM ('home', 'away');

-- CreateEnum
CREATE TYPE "public"."SquadRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "public"."PickStatus" AS ENUM ('pending', 'won', 'lost', 'pushed');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "oktaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "authProvider" "public"."AuthProvider" NOT NULL DEFAULT 'okta',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'active',
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "walletCurrency" TEXT NOT NULL DEFAULT 'eur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "displayName" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Game" (
    "id" TEXT NOT NULL,
    "startAtUtc" TIMESTAMP(3) NOT NULL,
    "weekId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameLine" (
    "gameId" TEXT NOT NULL,
    "spread" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAtUtc" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameLine_pkey" PRIMARY KEY ("gameId","source","fetchedAtUtc")
);

-- CreateTable
CREATE TABLE "public"."PickSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "submittedAtUtc" TIMESTAMP(3),
    "lockedAtUtc" TIMESTAMP(3),
    "tiebreakerScore" INTEGER,
    "status" "public"."PickSetStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "PickSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pick" (
    "id" TEXT NOT NULL,
    "pickSetId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "choice" "public"."PickChoice" NOT NULL,
    "spreadAtPick" DOUBLE PRECISION NOT NULL,
    "lineSource" TEXT NOT NULL,
    "createdAtUtc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."PickStatus" NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "payout" DOUBLE PRECISION,
    "odds" INTEGER,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Squad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "joinCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "potEnabled" BOOLEAN NOT NULL DEFAULT false,
    "potAmount" DOUBLE PRECISION,
    "potCurrency" TEXT NOT NULL DEFAULT 'eur',
    "potDeadline" TIMESTAMP(3),
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SquadMember" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."SquadRole" NOT NULL DEFAULT 'member',
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SquadPayment" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SquadPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stripePaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SquadMessage" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_oktaId_key" ON "public"."User"("oktaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_oktaId_idx" ON "public"."User"("oktaId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Game_weekId_idx" ON "public"."Game"("weekId");

-- CreateIndex
CREATE INDEX "PickSet_userId_idx" ON "public"."PickSet"("userId");

-- CreateIndex
CREATE INDEX "PickSet_weekId_idx" ON "public"."PickSet"("weekId");

-- CreateIndex
CREATE INDEX "PickSet_status_idx" ON "public"."PickSet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PickSet_userId_weekId_key" ON "public"."PickSet"("userId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_pickSetId_gameId_key" ON "public"."Pick"("pickSetId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Squad_joinCode_key" ON "public"."Squad"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "SquadMember_squadId_userId_key" ON "public"."SquadMember"("squadId", "userId");

-- CreateIndex
CREATE INDEX "SquadPayment_squadId_idx" ON "public"."SquadPayment"("squadId");

-- CreateIndex
CREATE INDEX "SquadPayment_userId_idx" ON "public"."SquadPayment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPayment_squadId_userId_key" ON "public"."SquadPayment"("squadId", "userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "public"."WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "public"."WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_idx" ON "public"."WalletTransaction"("status");

-- CreateIndex
CREATE INDEX "SquadMessage_squadId_idx" ON "public"."SquadMessage"("squadId");

-- CreateIndex
CREATE INDEX "SquadMessage_userId_idx" ON "public"."SquadMessage"("userId");

-- CreateIndex
CREATE INDEX "SquadMessage_createdAt_idx" ON "public"."SquadMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameLine" ADD CONSTRAINT "GameLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PickSet" ADD CONSTRAINT "PickSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pick" ADD CONSTRAINT "Pick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pick" ADD CONSTRAINT "Pick_pickSetId_fkey" FOREIGN KEY ("pickSetId") REFERENCES "public"."PickSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Squad" ADD CONSTRAINT "Squad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadMember" ADD CONSTRAINT "SquadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadMember" ADD CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "public"."Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadPayment" ADD CONSTRAINT "SquadPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadPayment" ADD CONSTRAINT "SquadPayment_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "public"."Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadMessage" ADD CONSTRAINT "SquadMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SquadMessage" ADD CONSTRAINT "SquadMessage_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "public"."Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
