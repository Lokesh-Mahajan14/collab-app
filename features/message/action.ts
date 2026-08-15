"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";

import {
  createAttachmentSchema,
  createMessageSchema,
  toggleReactionSchema,
} from "../../lib/validators/message";

import {
  createMessageService,
  deleteMessageService,
  markAsReadService,
  markMessagesBatchAsReadService,
  toggleReactionService,
  editMessageService,
  createAttachmentMessageService,
} from "./service";

import { MessageDTO } from "../../types/message";
import { findConversationMessages } from "./db";
import { MessageType } from "@prisma/client";
import { safeParse, unknown } from "zod";
import { mapMessageToDTO } from "./mapper";
import { findConversationById } from "../conversation/db";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function createMessageAction(
  values: unknown
): Promise<ActionResponse<MessageDTO>> {

  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const parsed =
    createMessageSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid request",
    };
  }

  try {

    const message =
      await createMessageService(
        parsed.data,
        session.user.id
      );

    const conversation = await findConversationById(
      parsed.data.conversationId
    );

    if (conversation) {
      revalidatePath(
        `/workspace/${conversation.workspaceId}/chat`
      );
    }

    return {
      success: true,
      data: {
  id: message.id,

  conversationId:
    message.conversationId,

  senderId:
    message.senderId,

  sender: {
    id: message.sender.id,
    name: message.sender.name,
    image: message.sender.image,
  },

  content:
    message.content,

  type:
    message.type,

  createdAt:
    message.createdAt,

  edited:
    message.edited,

  deleted:
    message.deleted,

  // NEW
  replyTo:
    message.replyTo
      ? {
          id: message.replyTo.id,

          content:
            message.replyTo.content,

          sender: {
            id:
              message.replyTo.sender.id,

            name:
              message.replyTo.sender.name,
          },

          attachments:
            message.replyTo.attachments,
        }
      : null,

  attachments:
    message.attachments,

  reads:
    message.reads,

  reactions:
    message.reactions,
}
    };

  } catch (error) {

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };

  }

}

export async function editMessageAction(
  messageId: string,
  content: string,
): Promise<ActionResponse<MessageDTO>> {

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  try {

    const message =
      await editMessageService(
        messageId,
        {
        content,
        },
        session.user.id
      );

    return {
      success: true,
      data: message,
    };

  } catch (error) {

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Something went wrong.",
    };

  }

}

export async function deleteMessageAction(
  messageId: string,
): Promise<ActionResponse<MessageDTO>> {

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  try {

    const message =
      await deleteMessageService(
        messageId,
        session.user.id
      );

    return {
      success: true,
      data: message,
    };

  } catch (error) {

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };

  }

}
export async function markMessageAsReadAction(
  messageId: string
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  try {
    await markAsReadService(
      messageId,
      session.user.id
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };
  }
}

export async function markMessagesBatchAction(
  messageIds: string[]
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  if (!messageIds || messageIds.length === 0) {
    return {
      success: true,
      data: { count: 0 },
    };
  }

  try {
    const result = await markMessagesBatchAsReadService(
      messageIds,
      session.user.id
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };
  }
}

export async function toggleReactionAction(
  values:unknown,
):Promise<ActionResponse<MessageDTO>>{
  const session=await getServerSession(
    authOptions,
  );
  if(!session?.user?.id){
    throw new Error("Unauthorised");

  }
  const parsed=toggleReactionSchema.safeParse(values,);
  if(!parsed.success){
    return{
      success: false,

      message: "Invalid request",
    };
  }
  try{
    const message=await toggleReactionService(
      parsed.data,
      session.user.id,
    );
    return {
      success:true,
      data:mapMessageToDTO(message!,),
    };


  }catch(error){
    return{
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Something went wrong.",

    }
  }
}


export async function getMessagesAction(
  conversationId: string,
  limit = 30
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return findConversationMessages({
    conversationId,
    currentUserId: session.user.id,
    limit,
  });
}

export async function getOlderMessagesAction(
  conversationId: string,
  cursor: string,
  limit = 30
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return findConversationMessages({
    conversationId,
    currentUserId: session.user.id,
    cursor,
    limit,
  });
}


export async function createAttachmentMessageAction(
  values: unknown,
)
{
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.id) {

    return {

      success: false,

      message:
        "Unauthorized",

    };

  }

  const parsed =
    createAttachmentSchema
      .safeParse(values);

  if (!parsed.success) {

    return {

      success: false,

      message:
        "Invalid request",

    };

  }

  const message =
    await createAttachmentMessageService(

      parsed.data,

      session.user.id,

    );

  return {

    success: true,

    data: {
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
              image: message.replyTo.sender.image,
            },
            attachments: message.replyTo.attachments,
          }
        : null,
      attachments: message.attachments,
      reads: message.reads,
      reactions: message.reactions,
    },

  };

}