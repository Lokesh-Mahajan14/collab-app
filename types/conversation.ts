import { ConversationType, MessageType } from "@prisma/client";
import { MessageAttachmentDTO } from "./message";

export interface CreateConversationDTO{
    workspaceId:string;
    memberIds:string[];
    name?:string;
    description?:string;
    type:"DIRECT"|"GROUP"|"CHANNEL"|"PRIVATE_CHANNEL";
}

export interface ConversationDTO {
  id: string;
  workspaceId: string;
  name: string | null;
  description: string | null;
  image: string | null;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;

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

    attachments: MessageAttachmentDTO[];
  } | null;

  lastMessageAt?: Date | null;

  unreadCount: number;
}