import { MessageAttachment, MessageType } from "@prisma/client";

export interface CreateMessageDTO {
  conversationId: string;
  content?: string;
  type: MessageType;
  replyToId?: string;
}

export interface MessageReadDTO {
  userId: string;

  seenAt: Date;
}

export interface MessageReactionDTO {
  id: string;

  userId: string;

  emoji: string;
}

export interface MessageAttachmentDTO {

  id: string;

  messageId: string;

  url: string;

  publicId: string;

  fileName: string;

  mimeType: string;

  size: number;

  createdAt: Date;
}

export interface MessageReactionDTO {

    id:string;

    messageId:string;

    userId:string;

    emoji:string;

     user:{
        id:string;
        name:string|null;
        image:string|null;
    }

}

export interface ToggleReactionDTO {
    messageId: string;
    emoji: string;
}


export interface MessageDTO {
  id: string;

  conversationId: string;

  senderId: string;

  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };

  content: string | null;

  type: MessageType;

  createdAt: Date;

  edited: boolean;

  deleted: boolean;

  replyTo?: {
    id: string;

    content: string | null;

    sender: {
      id: string;

      name: string | null;
    };

    attachments?: MessageAttachmentDTO[];
  } | null;

  attachments?: MessageAttachmentDTO[];

  reads: MessageReadDTO[];

  reactions: MessageReactionDTO[];

  isFirstUnread?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  content: string | null;
  createdAt: Date;
  type?: MessageType | string;
  edited?: boolean;
  editedAt?: Date | null;
  deleted?: boolean;
  deletedAt?: Date | null;
  replyTo?: {
    id: string;
    content: string | null;
    sender: {
      id: string;
      name: string | null;
      image?: string | null;
    };
    attachments?: MessageAttachmentDTO[];
  } | null;
  attachments?: any[];
  reads?: MessageReadDTO[];
  reactions?: MessageReactionDTO[];
  isFirstUnread?: boolean;
  pending?: boolean;
}

export interface UpdateMessageDTO {
  content: string;
}

// features/attachment/dto.ts

export interface CreateAttachmentDTO {

  conversationId: string;

  replyToId?: string;

  url: string;

  fileName: string;

  mimeType: string;

  size: number;

  publicId: string;

}


