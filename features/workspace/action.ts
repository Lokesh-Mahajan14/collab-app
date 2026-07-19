"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getWorkspaceMembersAction(
  workspaceId: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const member = await db.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
    },
  });

  if (!member) {
    throw new Error("You are not a member of this workspace.");
  }

  return db.workspaceMember.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}