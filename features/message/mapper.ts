import { Message } from "@prisma/client";
import { MessageDTO } from "@/types/message";

export function mapMessageToDTO(message: any): MessageDTO {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,

    sender: {
      id: message.sender.id,
      name: message.sender.name,
      image: message.sender.image,
    },

    content: message.content,

    type: message.type,

    createdAt: message.createdAt,

    edited: message.edited,

    deleted: message.deleted,

    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          sender: {
            id: message.replyTo.sender.id,
            name: message.replyTo.sender.name,
          },
          attachments: message.replyTo.attachments,
        }
      : null,

    attachments: message.attachments,

    reads: message.reads,

    reactions: message.reactions,
  };
}