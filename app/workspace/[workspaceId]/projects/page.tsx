import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskBoard from "@/components/tasks/TaskBoard";

async function getWorkspaceTasks(
  workspaceId: string,
  userId: string
) {
  const workspace = await db.workspace.findFirst({
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
      name: true,
      createdById: true,
      members: {
        select: {
          id: true,
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
        orderBy: {
          createdAt: "asc",
        },
      },
      tasks: {
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return workspace;
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const workspace = await getWorkspaceTasks(
    workspaceId,
    session.user.id
  );

  if (!workspace) {
    notFound();
  }

  const canCreateTasks =
    workspace.createdById === session.user.id;

  return (
    <div className="space-y-8 p-6">
      <section className="rounded-3xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Workspace projects
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Projects
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Assign work to teammates, add deadlines, and keep every task visible in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-2xl font-semibold">{workspace.tasks.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-2xl font-semibold">{workspace.members.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Can create</p>
              <p className="text-2xl font-semibold">
                {canCreateTasks ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        <CreateTaskDialog
          workspaceId={workspaceId}
          canCreateTasks={canCreateTasks}
          members={workspace.members}
        />

        <p className="text-xs text-muted-foreground">
          Tip: add due dates to make overdue work obvious.
        </p>
      </div>

      <TaskBoard
        workspaceId={workspaceId}
        tasks={workspace.tasks}
        members={workspace.members}
      />
    </div>
  );
}