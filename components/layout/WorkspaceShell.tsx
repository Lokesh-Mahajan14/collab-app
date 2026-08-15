import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import type { WorkspaceSidebarItem } from "@/lib/workspace";

type WorkspaceShellProps = {
  workspaces: WorkspaceSidebarItem[];
  currentWorkspaceId?: string;
  userName: string;
  userEmail: string;
  openCreateByDefault?: boolean;
  children: ReactNode;
};

export function WorkspaceShell({
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
  openCreateByDefault = false,
  children,
}: WorkspaceShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
          userName={userName}
          userEmail={userEmail}
          openCreateByDefault={openCreateByDefault}
        />

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </main>
  );
}