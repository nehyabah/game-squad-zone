-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickSetId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "spreadAtPick" REAL NOT NULL,
    "lineSource" TEXT NOT NULL,
    "createdAtUtc" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "payout" REAL,
    "odds" INTEGER,
    CONSTRAINT "Pick_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pick_pickSetId_fkey" FOREIGN KEY ("pickSetId") REFERENCES "PickSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pick" ("choice", "createdAtUtc", "gameId", "id", "lineSource", "pickSetId", "spreadAtPick") SELECT "choice", "createdAtUtc", "gameId", "id", "lineSource", "pickSetId", "spreadAtPick" FROM "Pick";
DROP TABLE "Pick";
ALTER TABLE "new_Pick" RENAME TO "Pick";
CREATE UNIQUE INDEX "Pick_pickSetId_gameId_key" ON "Pick"("pickSetId", "gameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
