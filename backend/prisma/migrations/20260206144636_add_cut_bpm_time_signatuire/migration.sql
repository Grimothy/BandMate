-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "providerId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "canCreateVibes" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vibe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "theme" TEXT,
    "notes" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vibe_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cut" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vibeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "lyrics" TEXT,
    "bpm" INTEGER,
    "timeSignature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cut_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "Vibe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "timestamp" REAL,
    "managedFileId" TEXT NOT NULL,
    "cutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_managedFileId_fkey" FOREIGN KEY ("managedFileId") REFERENCES "ManagedFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_cutId_fkey" FOREIGN KEY ("cutId") REFERENCES "Cut" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManagedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" REAL,
    "waveformData" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "cutId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManagedFile_cutId_fkey" FOREIGN KEY ("cutId") REFERENCES "Cut" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManagedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resourceLink" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "projectIds" TEXT,
    "invitedById" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "metadata" TEXT,
    "resourceLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityRead_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Vibe_projectId_slug_key" ON "Vibe"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Cut_vibeId_slug_key" ON "Cut"("vibeId", "slug");

-- CreateIndex
CREATE INDEX "Comment_cutId_idx" ON "Comment"("cutId");

-- CreateIndex
CREATE INDEX "Comment_managedFileId_idx" ON "Comment"("managedFileId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedFile_shareToken_key" ON "ManagedFile"("shareToken");

-- CreateIndex
CREATE INDEX "ManagedFile_cutId_idx" ON "ManagedFile"("cutId");

-- CreateIndex
CREATE INDEX "ManagedFile_uploadedById_idx" ON "ManagedFile"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_invitedById_idx" ON "Invitation"("invitedById");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Activity_projectId_createdAt_idx" ON "Activity"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "ActivityRead_userId_idx" ON "ActivityRead"("userId");

-- CreateIndex
CREATE INDEX "ActivityRead_activityId_idx" ON "ActivityRead"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityRead_activityId_userId_key" ON "ActivityRead"("activityId", "userId");
