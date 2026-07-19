import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = new Set([
  "todo",
  "in_progress",
  "in_review",
  "done",
]);

const ALLOWED_PRIORITIES = new Set([
  "low",
  "medium",
  "high",
  "urgent",
]);

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId, taskId } = await params;

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getAuthorizedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const nextStatus = typeof body.status === "string" ? body.status.toLowerCase() : null;
    const nextPriority =
      typeof body.priority === "string" ? body.priority.toLowerCase() : null;
    const nextTitle = typeof body.title === "string" ? body.title.trim() : "";
    const nextDescription =
      typeof body.description === "string" ? body.description.trim() : null;
    const nextDueDate = parseDateValue(body.dueDate);
    const nextAssignedToId =
      typeof body.assignedToId === "string" && body.assignedToId.trim().length > 0
        ? body.assignedToId
        : null;

    if (!nextTitle) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }

    if (nextPriority && !ALLOWED_PRIORITIES.has(nextPriority)) {
      return NextResponse.json({ error: "Invalid task priority" }, { status: 400 });
    }

    const task = await db.task.findFirst({
      where: {
        id: taskId,
        workspaceId,
      },
      select: {
        id: true,
        assignedToId: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAssignee = task.assignedToId === session.user.id;
    const isCreator = workspace.createdById === session.user.id;

    if (!isAssignee && !isCreator) {
      return NextResponse.json(
        { error: "You can only update tasks you own or created" },
        { status: 403 }
      );
    }

    if (nextAssignedToId) {
      const assigneeMembership = await db.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: nextAssignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assigneeMembership) {
        return NextResponse.json(
          {
            error: "Assigned member must belong to the selected workspace",
          },
          { status: 400 }
        );
      }
    }

    const updatedTask = await db.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: nextTitle,
        description: nextDescription,
        status: nextStatus ?? undefined,
        priority: nextPriority ?? undefined,
        dueDate: nextDueDate,
        assignedToId: nextAssignedToId,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId, taskId } = await params;

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getAuthorizedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const task = await db.task.findFirst({
      where: {
        id: taskId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.task.delete({
      where: {
        id: taskId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}