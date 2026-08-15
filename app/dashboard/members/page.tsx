import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Topbar } from "@/components/layout/Topbar";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceSidebarItems } from "@/lib/workspace";
import MembersClient from "@/components/dashboard/MembersClient";

type MembersPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

async function getMembersWorkspaceData(workspaceId: string) {
  return db.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      createdById: true,
      members: {
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: {
        where: { status: "PENDING", expiresAt: { gt: new Date() } },
        select: {
          id: true,
          email: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login");
  }

  const requestedWorkspaceId = resolvedSearchParams?.workspace;

  // Run sidebar items and requested workspace queries concurrently
  const [workspaceOptions, requestedWorkspace] = await Promise.all([
    getWorkspaceSidebarItems(session.user.id),
    requestedWorkspaceId ? getMembersWorkspaceData(requestedWorkspaceId) : Promise.resolve(null),
  ]);

  const selectedWorkspaceId =
    requestedWorkspaceId && workspaceOptions.some((w) => w.id === requestedWorkspaceId)
      ? requestedWorkspaceId
      : workspaceOptions[0]?.id;

  const workspace =
    selectedWorkspaceId === requestedWorkspaceId
      ? requestedWorkspace
      : selectedWorkspaceId
      ? await getMembersWorkspaceData(selectedWorkspaceId)
      : null;

  const currentMembership = workspace?.members.find((m) => m.user.id === session.user.id);
  const isOwnerOrAdmin =
    workspace?.createdById === session.user.id ||
    currentMembership?.role === "OWNER" ||
    currentMembership?.role === "ADMIN";

  const serializedMembers = (workspace?.members ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      status: m.user.status,
    },
  }));

  const serializedInvites = (workspace?.invites ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    createdAt: i.createdAt.toISOString(),
    expiresAt: i.expiresAt.toISOString(),
  }));

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
        currentPageTitle="Members"
      />

      <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <MembersClient
          workspaceId={selectedWorkspaceId ?? ""}
          workspaceName={workspace?.name ?? "Workspace"}
          members={serializedMembers}
          invites={serializedInvites}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          currentUserId={session.user.id}
        />
      </div>
    </WorkspaceShell>
  );
}
