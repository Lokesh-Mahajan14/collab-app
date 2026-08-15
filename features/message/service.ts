import { db } from "@/lib/db";

import {
  createMessage,
  findMessageById,
  updateMessage,
  deleteMessage,
  markMessageAsRead,
  markMessagesBatchAsRead,
  createReaction,
  deleteReaction,
  updateConversationLastMessage,
  findReaction,
  getMessageWithRelations,
} from "./db";

import { CreateAttachmentDTO, CreateMessageDTO, ToggleReactionDTO, UpdateMessageDTO } from "../../types/message";

export class MessageServiceError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "MessageServiceError";
  }
}


async function validateConversationMember(
  conversationId: string,
  userId: string
) {
  const conversation =
    await db.conversation.findFirst({
      where: {
        id: conversationId,

        members: {
          some: {
            userId,
          },
        },
      },

      select: {
        id: true,
      },
    });

  if (!conversation) {
    throw new MessageServiceError(
      "Conversation not found or access denied."
    );
  }

  return conversation;
}

async function validateReplyMessage(
  replyToId: string,
  conversationId: string
) {
  const reply =
    await db.message.findFirst({
      where: {
        id: replyToId,

        conversationId,
      },

      select: {
        id: true,
      },
    });

  if (!reply) {
    throw new MessageServiceError(
      "Reply message not found."
    );
  }

  return reply;
}

export async function createMessageService(
  dto: CreateMessageDTO,
  currentUserId: string,
) {

  await validateConversationMember(
    dto.conversationId,
    currentUserId
  );

  if (dto.replyToId) {

    await validateReplyMessage(
      dto.replyToId,
      dto.conversationId
    );

  }

  const message =
    await db.message.create({

      data: {

        conversation: {
          connect: {
            id: dto.conversationId,
          },
        },

        sender: {
          connect: {
            id: currentUserId,
          },
        },

        content: dto.content,

        type: dto.type,

        ...(dto.replyToId && {

          replyTo: {
            connect: {
              id: dto.replyToId,
            },
          },

        }),

      },

      include: {

        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },

        replyTo: {
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

        attachments: true,

        reads: {
          select: {
            userId: true,
            seenAt: true,
          },
        },

        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },

      },

    });

  await db.conversation.update({

    where: {
      id: dto.conversationId,
    },

    data: {

      lastMessageId: message.id,

      lastMessageAt: new Date(),

    },

  });

  return message;
}

export async function editMessageService(
  messageId: string,
  dto: UpdateMessageDTO,
  currentUserId: string
) {
  const message =
    await findMessageById(messageId);

  if (!message) {
    throw new MessageServiceError(
      "Message not found."
    );
  }

  if (
    message.senderId !== currentUserId
  ) {
    throw new MessageServiceError(
      "You can only edit your own messages."
    );
  }
  if (message.deleted) {
    throw new Error(
      "Cannot edit deleted message."
    );
  }

  const trimmed =
    dto.content.trim();

  if (!trimmed) {
    throw new Error(
      "Message content required."
    );
  }

  if (
    message.content === trimmed
  ) {
    return message;
  }


  return updateMessage(messageId, {
    content: trimmed,
  });
}


export async function deleteMessageService(
  messageId: string,
  currentUserId: string
) {
  const message =
    await findMessageById(messageId);

  if (!message) {
    throw new MessageServiceError(
      "Message not found."
    );
  }

  if (
    message.senderId !== currentUserId
  ) {
    throw new MessageServiceError(
      "You can only delete your own messages."
    );
  }
  if (message.deleted) {
    return message;
  }

  return deleteMessage(messageId);
}

export async function markAsReadService(
  messageId: string,
  currentUserId: string
) {
  return markMessageAsRead(
    messageId,
    currentUserId
  );
}

export async function markMessagesBatchAsReadService(
  messageIds: string[],
  currentUserId: string
) {
  return markMessagesBatchAsRead(
    messageIds,
    currentUserId
  );
}


export async function toggleReactionService(
  dto:ToggleReactionDTO,
  currentUserId:string
){
  const message=await findMessageById(dto.messageId);

  if(!message){
    throw new  MessageServiceError(
      "Message Not Found"
    );
  }

  const existing=await findReaction(
    dto.messageId,
    currentUserId,
    dto.emoji
  )

  if(existing){
    await deleteReaction(
      existing.id,
    )
  }else{
    await createReaction(
      dto.messageId,

      currentUserId,

      dto.emoji,
    )
  }

  return getMessageWithRelations(
    dto.messageId,
  );


}



// features/attachment/service.ts

import {
  createAttachmentMessage
}
from "./db";
import { error } from "console";

export async function createAttachmentMessageService(
  dto:
    CreateAttachmentDTO,
  currentUserId: string,
)
{
  return createAttachmentMessage({

    ...dto,

    senderId:
      currentUserId,

    replyToId:
      dto.replyToId,

  });
}