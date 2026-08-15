"use server";

import {authOptions} from "@/lib/auth"
import { revalidatePath } from "next/cache";

import {
  createConversationSchema,
  deleteConversationSchema,
  renameConversationSchema,
} from "@/lib/validators/conversation";
import {
  createConversationService,
  deleteConversationService,
  getUserConversations,
  renameConversation,
} from "./service";
import { getServerSession } from "next-auth";
import { ConversationDTO } from "@/types/conversation";
import { toConversationDTO } from "./mapper";
import { findConversationById } from "./db";

type ActionResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export async function createConversationaction(
 values:unknown

): Promise<ActionResponse<ConversationDTO>>{
    const session=await getServerSession(authOptions);

    if(!session){
        return{
            success:false,
            message:"undefined",
        };
    }

    const parsed=createConversationSchema.safeParse(values);
    if(!parsed.success){
        return{
            success:false,
            message:"Inalid request. ",
        }
    }

    try{
        const conversation=await createConversationService(
            parsed.data,
            session.user.id

        );
            revalidatePath("/workspace");
            return{
                success:true,
                data: toConversationDTO(conversation),
            }
    }

    catch(e){
        return {

            success: false,

            message:
                e instanceof Error
                    ? e.message
                    : "Something went wrong.",

        };
    }



}

export async function getUserConversationsAction(
  workspaceId:string
){
        const session =
    await getServerSession(authOptions);

    if(!session?.user?.id){

        throw new Error("Unauthorized");

    }
    return getUserConversations(
        workspaceId,
        session.user.id
    );
}

export async function getConversationAction(
  conversationId: string
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return findConversationById(
    conversationId
  );
}

async function requireConversationAccess(
  conversationId: string,
  userId: string,
) {
  const conversation = await findConversationById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const canAccess = conversation.members.some(
    (member) => member.userId === userId,
  );

  if (!canAccess) {
    throw new Error("Unauthorized");
  }

  return conversation;
}

export async function renameConversationAction(values: unknown): Promise<ActionResponse<ConversationDTO>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const parsed = renameConversationSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid request.",
    };
  }

  try {
    const conversation = await requireConversationAccess(
      parsed.data.conversationId,
      session.user.id,
    );

    const nextName = parsed.data.name.trim();

    if (!nextName && conversation.type !== "DIRECT") {
      return {
        success: false,
        message: "Conversation name is required.",
      };
    }

    await renameConversation(
      parsed.data.conversationId,
      nextName || null,
    );

    const updatedConversation = await findConversationById(
      parsed.data.conversationId,
    );

    if (!updatedConversation) {
      return {
        success: false,
        message: "Conversation not found.",
      };
    }

    revalidatePath(`/workspace/${parsed.data.workspaceId}/chat`);
    revalidatePath(
      `/workspace/${parsed.data.workspaceId}/chat/${parsed.data.conversationId}`,
    );

    return {
      success: true,
      data: toConversationDTO(updatedConversation),
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}

export async function deleteConversationAction(values: unknown): Promise<ActionResponse<{ id: string }>> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const parsed = deleteConversationSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid request.",
    };
  }

  try {
    await requireConversationAccess(
      parsed.data.conversationId,
      session.user.id,
    );

    await deleteConversationService(parsed.data.conversationId);

    revalidatePath(`/workspace/${parsed.data.workspaceId}/chat`);

    return {
      success: true,
      data: {
        id: parsed.data.conversationId,
      },
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}