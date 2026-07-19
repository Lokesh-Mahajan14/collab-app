import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { addTaskNote } from "@/lib/my-tasks";

export async function POST(
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
    const content = typeof body.content === "string" ? body.content : "";

    const note = await addTaskNote({
      workspaceId,
      taskId,
      userId: session.user.id,
      content,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Failed to save note";
    const status = message === "Task not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
