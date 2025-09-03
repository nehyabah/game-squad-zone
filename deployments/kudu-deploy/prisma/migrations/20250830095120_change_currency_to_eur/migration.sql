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
    "potCurrency" TEXT NOT NULL DEFAULT 'eur',
    "potDeadline" DATETIME,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Squad_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Squad" ("createdAt", "description", "id", "imageUrl", "joinCode", "name", "ownerId", "potAmount", "potCurrency", "potDeadline", "potEnabled", "stripePriceId", "stripeProductId", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "joinCode", "name", "ownerId", "potAmount", "potCurrency", "potDeadline", "potEnabled", "stripePriceId", "stripeProductId", "updatedAt" FROM "Squad";
DROP TABLE "Squad";
ALTER TABLE "new_Squad" RENAME TO "Squad";
CREATE UNIQUE INDEX "Squad_joinCode_key" ON "Squad"("joinCode");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oktaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'okta',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "walletBalance" REAL NOT NULL DEFAULT 0.0,
    "walletCurrency" TEXT NOT NULL DEFAULT 'eur',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);
INSERT INTO "new_User" ("authProvider", "avatarUrl", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "oktaId", "status", "updatedAt", "username", "walletBalance", "walletCurrency") SELECT "authProvider", "avatarUrl", "createdAt", "email", "emailVerified", "firstName", "id", "lastLoginAt", "lastName", "oktaId", "status", "updatedAt", "username", "walletBalance", "walletCurrency" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_oktaId_key" ON "User"("oktaId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_oktaId_idx" ON "User"("oktaId");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE TABLE "new_WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "type" TEXT NOT NULL,
    "description" TEXT,
    "stripePaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WalletTransaction" ("amount", "createdAt", "currency", "description", "id", "status", "stripePaymentId", "type", "updatedAt", "userId") SELECT "amount", "createdAt", "currency", "description", "id", "status", "stripePaymentId", "type", "updatedAt", "userId" FROM "WalletTransaction";
DROP TABLE "WalletTransaction";
ALTER TABLE "new_WalletTransaction" RENAME TO "WalletTransaction";
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
