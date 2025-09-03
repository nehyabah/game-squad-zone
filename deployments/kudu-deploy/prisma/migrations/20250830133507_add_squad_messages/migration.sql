-- CreateTable
CREATE TABLE "SquadMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SquadMessage_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SquadMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SquadMessage_squadId_idx" ON "SquadMessage"("squadId");

-- CreateIndex
CREATE INDEX "SquadMessage_userId_idx" ON "SquadMessage"("userId");

-- CreateIndex
CREATE INDEX "SquadMessage_createdAt_idx" ON "SquadMessage"("createdAt");
