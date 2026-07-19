import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchMyTasks } from "@/lib/my-tasks";

import MyTasksDashboard from "@/components/tasks/MyTasksDashboard";

async function getWorkspaceContext(workspaceId: string, userId: string) {
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
    },
  });
}

export default async function MyTasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const workspace = await getWorkspaceContext(workspaceId, session.user.id);

  if (!workspace) {
    notFound();
  }

  const tasks = await fetchMyTasks(workspaceId, session.user.id);

  return (
    <MyTasksDashboard
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      canCreateTasks={workspace.createdById === session.user.id}
      members={workspace.members}
      tasks={tasks}
    />
  );
}
