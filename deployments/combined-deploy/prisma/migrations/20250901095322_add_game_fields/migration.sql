/*
  Warnings:

  - Added the required column `awayTeam` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeTeam` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startAtUtc" DATETIME NOT NULL,
    "weekId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Game" ("id", "startAtUtc", "weekId") SELECT "id", "startAtUtc", "weekId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_weekId_idx" ON "Game"("weekId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
