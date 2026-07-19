import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function getAuthorizedWorkspace(
  workspaceId: string,
  userId: string
) {
  return db.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await params;

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspace = await getAuthorizedWorkspace(
      workspaceId,
      session.user.id
    );

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const members = await db.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        userId: true,
        workspaceId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(
      members.map((member) => ({
        ...member,
        joinedAt: member.createdAt,
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch workspace members" },
      { status: 500 }
    );
  }
}