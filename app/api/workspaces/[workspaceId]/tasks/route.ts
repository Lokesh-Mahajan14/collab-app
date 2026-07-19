import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function parseDateValue(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
      createdById: true,
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

    const tasks = await db.task.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        workspaceId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await params;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const workspace = await getAuthorizedWorkspace(
      workspaceId,
      user.id
    );

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // ONLY WORKSPACE CREATOR CAN CREATE TASKS
    if (workspace.createdById !== user.id) {
      return NextResponse.json(
        { error: "Only workspace owner can assign tasks" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const assignedToId =
      typeof body.assignedToId === "string" &&
      body.assignedToId.trim().length > 0
        ? body.assignedToId
        : null;

    if (assignedToId) {
      const assigneeMembership =
        await db.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: assignedToId,
          },
          select: {
            id: true,
          },
        });

      if (!assigneeMembership) {
        return NextResponse.json(
          {
            error:
              "Assigned member must belong to the selected workspace",
          },
          { status: 400 }
        );
      }
    }

    console.log("Creating task", {
      workspaceId,
      createdById: user.id,
      title: body.title,
      assignedToId,
      priority: body.priority,
      dueDate: body.dueDate,
    });

    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority,
        dueDate: parseDateValue(body.dueDate),
        assignedToId,
        workspaceId,
        createdById: user.id,
      },

      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(task);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}