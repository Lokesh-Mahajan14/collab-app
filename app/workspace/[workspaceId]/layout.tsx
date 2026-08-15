import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { authOptions } from "@/lib/auth";
import { getWorkspaceSidebarItems } from "@/lib/workspace";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = await params;

  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login");
  }

  const workspaces = await getWorkspaceSidebarItems(session.user.id);

  if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
    notFound();
  }

  return (
    <WorkspaceShell
      workspaces={workspaces}
      currentWorkspaceId={workspaceId}
      userName={session.user.name ?? "User"}
      userEmail={session.user.email}
    >
      {children}
    </WorkspaceShell>
  );
}