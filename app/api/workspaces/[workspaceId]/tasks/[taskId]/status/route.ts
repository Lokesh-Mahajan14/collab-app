import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { updateTaskStatus } from "@/lib/my-tasks";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId, taskId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const status = typeof body.status === "string" ? body.status : "";

    const updatedTask = await updateTaskStatus({
      workspaceId,
      taskId,
      userId: session.user.id,
      status,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Failed to update task status";
    const status = message === "Task not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
