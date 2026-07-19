"use server";

import {authOptions} from "@/lib/auth"
import { revalidatePath } from "next/cache";

import { createConversationSchema } from "@/lib/validators/conversation";
import { createConversationService, getUserConversations } from "./service";
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