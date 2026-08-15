import { ConversationType, MessageType } from "@prisma/client";
import { ConversationDTO } from "@/types/conversation";

type ConversationWithRelations = {
  id: string;
  workspaceId: string;
  name: string | null;
  image: string | null;
  description: string | null;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  members: {
    userId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      email: string;
    };
  }[];
  lastMessage?: {
    id: string;
    content: string | null;
    type: MessageType;
    createdAt: Date;
    sender: {
      id: string;
      name: string | null;
      image: string | null;
    };
    attachments: {
      id: string;
      messageId: string;
      url: string;
      publicId: string;
      fileName: string;
      mimeType: string;
      size: number;
      createdAt: Date;
    }[];
  } | null;
};

export function toConversationDTO(
  conversation: ConversationWithRelations
): ConversationDTO {
  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    name: conversation.name,
    image: conversation.image,
    description: conversation.description,
    type: conversation.type,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    members: conversation.members.map((member) => ({
      userId: member.userId,
      user: {
        id: member.user.id,
        name: member.user.name,
        image: member.user.image,
        email: member.user.email,
      },
    })),
    lastMessage: conversation.lastMessage
      ? {
          id: conversation.lastMessage.id,
          content: conversation.lastMessage.content,
          type: conversation.lastMessage.type,
          createdAt: conversation.lastMessage.createdAt,
          sender: {
            id: conversation.lastMessage.sender.id,
            name: conversation.lastMessage.sender.name,
            image: conversation.lastMessage.sender.image,
          },
          attachments: conversation.lastMessage.attachments.map((attachment) => ({
            id: attachment.id,
            messageId: attachment.messageId,
            url: attachment.url,
            publicId: attachment.publicId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            createdAt: attachment.createdAt,
          })),
        }
      : null,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: 0,

  };
}