-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'CHANNEL', 'PRIVATE_CHANNEL');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'VIDEO', 'AUDIO', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMMENT', 'WORKSPACE_INVITE', 'MENTION', 'REACTION', 'SYSTEM');

-- DropIndex
DROP INDEX "TaskNote_taskId_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeen" TIMESTAMP(3),
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "description" TEXT,
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "image" TEXT,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    "lastMessageId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "replyToId" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_workspaceId_idx" ON "Conversation"("workspaceId");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "Conversation"("type");

-- CreateIndex
CREATE INDEX "ConversationMember_conversationId_idx" ON "ConversationMember"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_idx" ON "ConversationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_userId_conversationId_key" ON "ConversationMember"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_senderId_idx" ON "Notification"("senderId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskNote_createdAt_idx" ON "TaskNote"("createdAt");

-- CreateIndex
CREATE INDEX "Workspace_createdById_idx" ON "Workspace"("createdById");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
