import { Conversation } from "@prisma/client";
import { ConversationDTO } from "@/types/conversation";

export function toConversationDTO(
  conversation: Conversation
): ConversationDTO {
  return {
    id: conversation.id,
    workspaceId:conversation.workspaceId,
    name: conversation.name ?? "",
    image: conversation.image,
    description:conversation.description,
    type: conversation.type,
    createdAt:conversation.createdAt,
    updatedAt:conversation.updatedAt,


  };
}