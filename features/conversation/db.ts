import { db } from "@/lib/db";
import { ConversationType, Prisma } from "@prisma/client";
import { string } from "zod";

export interface FindConversationOptions {
  includeMembers?: boolean;
  includeLastMessage?: boolean;
}

const defaultConversationInclude = {


  members: {
    include: {
      user: true,
    },
  },

  lastMessage: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: true,
    },
  },

};

export async function findConversationById(id: string) {
  return db.conversation.findUnique({
    where: {
      id,
    },
    include: defaultConversationInclude,
  });
}

export async function findWorkspaceConversations(
  workspaceId: string
) {
  const conversations = await db.conversation.findMany({
    where: {
      workspaceId,
    },

    include: defaultConversationInclude,
  });

  conversations.sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;

    return bTime.getTime() - aTime.getTime();
  });

  return conversations;
}

export async function findUserConversations(
  workspaceId: string,
  userId: string,
) {
  const conversations = await db.conversation.findMany({
    where: {
      workspaceId,
      members: {
        some: {
          userId,
        },
      },
    },

    include: defaultConversationInclude,
  });

  conversations.sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;

    return bTime.getTime() - aTime.getTime();
  });

  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length === 0) {
    return [];
  }

  const unreadGroups = await db.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      deleted: false,
      reads: {
        none: {
          userId,
        },
      },
    },
    _count: {
      id: true,
    },
  });

  const unreadMap = new Map<string, number>();
  for (const group of unreadGroups) {
    unreadMap.set(group.conversationId, group._count.id);
  }

  return conversations.map((conversation) => ({
    ...conversation,
    unreadCount: unreadMap.get(conversation.id) ?? 0,
  }));
}
export async function createConversation(data: Prisma.ConversationCreateInput) {
  return db.conversation.create({
    data,

    include: defaultConversationInclude,
  });
}

export async function createConversationWithMembers(
  conversationData: Prisma.ConversationCreateInput,
  memberIds: string[],
) {
  return db.$transaction(async (tx) => {
    const createdConversation = await tx.conversation.create({
      data: conversationData,
    });

    await tx.conversationMember.createMany({
      data: memberIds.map((id) => ({
        userId: id,
        conversationId: createdConversation.id,
      })),
    });

    const createdConversationWithMembers =
      await tx.conversation.findUnique({
        where: {
          id: createdConversation.id,
        },
        include: defaultConversationInclude,
      });

    if (!createdConversationWithMembers) {
      throw new Error("Conversation was not created.");
    }

    return createdConversationWithMembers;
  });
}

export async function updateConversation(
  id: string,
  data: Prisma.ConversationUpdateInput,
) {
  return db.conversation.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteConversation(id: string) {
  return db.conversation.delete({
    where: {
      id,
    },
  });
}
