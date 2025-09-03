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
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
