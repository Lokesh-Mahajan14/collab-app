-- CreateTable
CREATE TABLE "TaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskNote_taskId_idx" ON "TaskNote"("taskId");

-- CreateIndex
CREATE INDEX "TaskNote_userId_idx" ON "TaskNote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskNote_taskId_userId_key" ON "TaskNote"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
