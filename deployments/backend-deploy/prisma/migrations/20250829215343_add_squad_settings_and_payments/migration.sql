/*
  Warnings:

  - Added the required column `updatedAt` to the `Squad` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SquadPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SquadPayment_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Squad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "joinCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "potEnabled" BOOLEAN NOT NULL DEFAULT false,
    "potAmount" REAL,
    "potCurrency" TEXT NOT NULL DEFAULT 'usd',
    "potDeadline" DATETIME,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Squad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Squad" ("id", "joinCode", "name", "ownerId") SELECT "id", "joinCode", "name", "ownerId" FROM "Squad";
DROP TABLE "Squad";
ALTER TABLE "new_Squad" RENAME TO "Squad";
CREATE UNIQUE INDEX "Squad_joinCode_key" ON "Squad"("joinCode");
CREATE TABLE "new_SquadMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SquadMember" ("id", "role", "squadId", "userId") SELECT "id", "role", "squadId", "userId" FROM "SquadMember";
DROP TABLE "SquadMember";
ALTER TABLE "new_SquadMember" RENAME TO "SquadMember";
CREATE UNIQUE INDEX "SquadMember_squadId_userId_key" ON "SquadMember"("squadId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SquadPayment_squadId_idx" ON "SquadPayment"("squadId");

-- CreateIndex
CREATE INDEX "SquadPayment_userId_idx" ON "SquadPayment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadPayment_squadId_userId_key" ON "SquadPayment"("squadId", "userId");
