-- CreateTable
CREATE TABLE "ProjectDigestConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectDigestConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMemberDigestPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectMemberDigestPreference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMemberDigestPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DigestRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "windowEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredItemCount" INTEGER NOT NULL DEFAULT 0,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DigestRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DigestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digestRunId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigestItem_digestRunId_fkey" FOREIGN KEY ("digestRunId") REFERENCES "DigestRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DigestItem_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DigestItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DigestItem_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDigestConfig_projectId_key" ON "ProjectDigestConfig"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDigestConfig_enabled_nextRunAt_idx" ON "ProjectDigestConfig"("enabled", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberDigestPreference_projectId_userId_key" ON "ProjectMemberDigestPreference"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectMemberDigestPreference_userId_idx" ON "ProjectMemberDigestPreference"("userId");

-- CreateIndex
CREATE INDEX "DigestRun_projectId_createdAt_idx" ON "DigestRun"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DigestItem_recipientId_projectId_activityId_key" ON "DigestItem"("recipientId", "projectId", "activityId");

-- CreateIndex
CREATE INDEX "DigestItem_projectId_recipientId_createdAt_idx" ON "DigestItem"("projectId", "recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "DigestItem_digestRunId_idx" ON "DigestItem"("digestRunId");
