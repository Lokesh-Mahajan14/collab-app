import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Topbar } from "@/components/layout/Topbar";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceSidebarItems } from "@/lib/workspace";
import NotificationsClient from "@/components/dashboard/NotificationsClient";

type NotificationsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login");
  }

  const workspaceOptions = await getWorkspaceSidebarItems(session.user.id);

  const selectedWorkspaceId =
    resolvedSearchParams?.workspace && workspaceOptions.some((w) => w.id === resolvedSearchParams.workspace)
      ? resolvedSearchParams.workspace
      : workspaceOptions[0]?.id;

  const currentWorkspace = workspaceOptions.find((w) => w.id === selectedWorkspaceId);

  // Fetch user notifications
  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const serializedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    referenceId: n.referenceId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    sender: n.sender
      ? {
          id: n.sender.id,
          name: n.sender.name,
          email: n.sender.email,
        }
      : null,
  }));

  return (
    <WorkspaceShell
      workspaces={workspaceOptions}
      currentWorkspaceId={selectedWorkspaceId}
      userName={session.user.name ?? "User"}
      userEmail={session.user.email}
    >
      <Topbar
        workspaceName={currentWorkspace?.name}
        workspaceId={selectedWorkspaceId}
        currentPageTitle="Notifications"
      />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <NotificationsClient
          initialNotifications={serializedNotifications}
          workspaceId={selectedWorkspaceId}
        />
      </div>
    </WorkspaceShell>
  );
}
