import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Topbar } from "@/components/layout/Topbar";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceSidebarItems } from "@/lib/workspace";
import SettingsClient from "@/components/dashboard/SettingsClient";

type SettingsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
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

  const workspace = selectedWorkspaceId
    ? await db.workspace.findUnique({
        where: { id: selectedWorkspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdById: true,
          createdAt: true,
        },
      })
    : null;

  const isOwner = workspace?.createdById === session.user.id;

  return (
    <WorkspaceShell
      workspaces={workspaceOptions}
      currentWorkspaceId={selectedWorkspaceId}
      userName={session.user.name ?? "User"}
      userEmail={session.user.email}
    >
      <Topbar
        workspaceName={workspace?.name}
        workspaceId={selectedWorkspaceId}
        currentPageTitle="Settings"
      />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
        <SettingsClient
          workspace={
            workspace
              ? {
                  id: workspace.id,
                  name: workspace.name,
                  slug: workspace.slug,
                  description: workspace.description,
                  createdAt: workspace.createdAt.toISOString(),
                }
              : null
          }
          user={{
            id: session.user.id,
            name: session.user.name ?? "User",
            email: session.user.email,
          }}
          isOwner={isOwner}
        />
      </div>
    </WorkspaceShell>
  );
}
