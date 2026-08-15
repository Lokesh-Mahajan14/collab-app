import {
  createConversationWithMembers,
  deleteConversation,
  findConversationById,
  findUserConversations,
  updateConversation,
} from "./db";

import { db } from "@/lib/db";

import type { CreateConversationDTO } from "../../types/conversation";
import { ConversationType } from "@prisma/client";

export class ConversationServiceError extends Error {
  constructor(messsage: string) {
    super(messsage);
    this.name = "ConversationServiceError";
  }
}
async function validateWorkspace(workspaceId: string) {
  const workspace = await db.workspace.findUnique({
    where: {
      id: workspaceId,
    },
  });

  if (!workspace) {
    throw new ConversationServiceError("Workspace not found.");
  }

  return workspace;
}

async function validateMember(workspaceId: string, userId: string) {
  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,

        workspaceId,
      },
    },
  });

  if (!member) {
    throw new ConversationServiceError(
      "You are not a member of this workspace.",
    );
  }
}

async function validateMembers(
  workspaceId: string,

  memberIds: string[],
) {
  const members = await db.workspaceMember.findMany({
    where: {
      workspaceId,

      userId: {
        in: memberIds,
      },
    },
  });

  if (members.length !== memberIds.length) {
    throw new ConversationServiceError("Some users are not workspace members.");
  }
}

async function findExistingDirectConversation(
  workspaceId: string,
  memberIds: string[],
): Promise<{ id: string } | null> {
  const conversations = await db.conversation.findMany({
    where: {
      workspaceId,

      type: ConversationType.DIRECT,
    },

    include: {
      members: true,
    },
  });

  const existingConversation = conversations.find((conversation) => {
    const ids = conversation.members.map((m) => m.userId).sort();

    const target = [...memberIds].sort();

    return JSON.stringify(ids) === JSON.stringify(target);
  });

  return existingConversation ? { id: existingConversation.id } : null;
}

export async function createConversationService(
  dto: CreateConversationDTO,

  currentUserId: string,
): Promise<NonNullable<Awaited<ReturnType<typeof findConversationById>>>> {
  await validateWorkspace(dto.workspaceId);

  await validateMember(dto.workspaceId, currentUserId);

  await validateMembers(dto.workspaceId, dto.memberIds);

    if(dto.type===ConversationType.DIRECT){

      if(dto.memberIds.length!==1){

        throw new ConversationServiceError(

          "Direct conversations require exactly one selected user."

        );

      }

      if(dto.memberIds[0]===currentUserId){
        throw new ConversationServiceError(
          "You cannot create a direct conversation with yourself."
        );
      }

    }
    if(dto.type===ConversationType.DIRECT){

    const existing =
    await findExistingDirectConversation(

        dto.workspaceId,
        [
          currentUserId,
          ...dto.memberIds

        ]

        

    );

    if(existing){

        const refreshedExisting = await findConversationById(existing.id);

        if (!refreshedExisting) {
          throw new ConversationServiceError("Conversation not found.");
        }

        return refreshedExisting;

    }

}
  const allMembers = [
    currentUserId,
    ...dto.memberIds,
  ];

  const uniqueMembers = [
    ...new Set(allMembers),
  ];

  const createdConversation = await createConversationWithMembers(
    {
      workspace: {
        connect: {
          id: dto.workspaceId,
        },
      },

      name: dto.type===ConversationType.DIRECT ? null : dto.name,

      description: dto.description,

      type: dto.type,
    },

    uniqueMembers
  );

  const refreshedConversation = await findConversationById(
    createdConversation.id,
  );

  if (!refreshedConversation) {
    throw new ConversationServiceError("Conversation not found.");
  }

  return refreshedConversation;


}

export async function renameConversation(

    id:string,

  name:string | null

){

    return updateConversation(

        id,

        {

            name

        }

    );

}

export async function deleteConversationService(

    id:string

){

    const conversation =
    await findConversationById(id);

    if(!conversation){

        throw new ConversationServiceError(

            "Conversation not found."

        );

    }

    return deleteConversation(id);

}

export async function getUserConversations(

    workspaceId:string,

    userId:string

){

    return findUserConversations(

        workspaceId,

        userId

    );

}