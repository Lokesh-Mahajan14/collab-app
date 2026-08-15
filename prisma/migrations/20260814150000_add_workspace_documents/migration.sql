-- CreateEnum
CREATE TYPE "WorkspaceDocumentType" AS ENUM ('FILE', 'LINK');

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "type" "WorkspaceDocumentType" NOT NULL DEFAULT 'FILE',
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "publicId" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceDocument_workspaceId_idx" ON "WorkspaceDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_uploadedById_idx" ON "WorkspaceDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_type_idx" ON "WorkspaceDocument"("type");

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceDocument" ADD CONSTRAINT "WorkspaceDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;