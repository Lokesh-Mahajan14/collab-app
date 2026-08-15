import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BarChart3, CheckCircle2, Clock, FolderKanban, Users, TrendingUp, AlertCircle, FileText } from "lucide-react";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Topbar } from "@/components/layout/Topbar";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceSidebarItems } from "@/lib/workspace";

import { getCached, setCached } from "@/lib/redis";

type AnalyticsPageProps = {
  searchParams?: Promise<{
    workspace?: string;
  }>;
};

async function getAnalyticsWorkspace(workspaceId: string) {
  const cacheKey = `analytics:workspace:${workspaceId}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const data = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      tasks: true,
      conversations: true,
      documents: true,
    },
  });

  if (data) {
    await setCached(cacheKey, data, 60);
  }

  return data;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login");
  }

  const requestedWorkspaceId = resolvedSearchParams?.workspace;

  const [workspaceOptions, requestedWorkspace] = await Promise.all([
    getWorkspaceSidebarItems(session.user.id),
    requestedWorkspaceId ? getAnalyticsWorkspace(requestedWorkspaceId) : Promise.resolve(null),
  ]);

  const selectedWorkspaceId =
    requestedWorkspaceId && workspaceOptions.some((w) => w.id === requestedWorkspaceId)
      ? requestedWorkspaceId
      : workspaceOptions[0]?.id;

  const workspace =
    selectedWorkspaceId === requestedWorkspaceId
      ? requestedWorkspace
      : selectedWorkspaceId
      ? await getAnalyticsWorkspace(selectedWorkspaceId)
      : null;

  const tasks = (workspace?.tasks ?? []) as any[];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "in-progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const highPriorityTasks = tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const memberCount = workspace?.members.length ?? 0;
  const filesCount = workspace?.documents.length ?? 0;
  const channelsCount = workspace?.conversations.length ?? 0;

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
        currentPageTitle="Analytics"
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Performance & Metrics
                </p>
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {workspace?.name ?? "Workspace"} Analytics
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time insights on task velocity, project milestones, and team workload.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/60">
              <div className="text-center px-2">
                <p className="text-2xl font-extrabold text-primary">{completionRate}%</p>
                <p className="text-[11px] font-medium text-muted-foreground">Completion</p>
              </div>
              <div className="h-8 w-px bg-border/80" />
              <div className="text-center px-2">
                <p className="text-2xl font-extrabold text-foreground">{totalTasks}</p>
                <p className="text-[11px] font-medium text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview Stats Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed Tasks</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{completionRate}% of all items</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active team sprints</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">To Do</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{todoTasks}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pending backlog</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Members</p>
              <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{memberCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{channelsCount} chat channel(s)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Task Progress Breakdown */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Task Distribution
              </h2>
              <span className="text-xs text-muted-foreground">{totalTasks} tasks recorded</span>
            </div>

            {totalTasks === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                No tasks created in this workspace yet.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">Completed</span>
                    <span>{completedTasks} ({completionRate}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-blue-600 dark:text-blue-400">In Progress</span>
                    <span>
                      {inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-amber-600 dark:text-amber-400">To Do</span>
                    <span>
                      {todoTasks} ({totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {highPriorityTasks > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs text-destructive font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{highPriorityTasks} task(s) marked as high or urgent priority</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workspace Assets & Collaborators */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              Workspace Resources & Activity
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl border border-border/70 bg-background">
                <p className="text-xs text-muted-foreground">Shared Documents</p>
                <p className="text-xl font-bold mt-1">{filesCount}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/70 bg-background">
                <p className="text-xs text-muted-foreground">Chat Channels</p>
                <p className="text-xl font-bold mt-1">{channelsCount}</p>
              </div>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Team Members ({memberCount})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(workspace?.members ?? []).map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-background text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                      {member.user?.name ? member.user.name.slice(0, 1).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.user?.name ?? "User"}</p>
                      <p className="text-[10px] text-muted-foreground">{member.user?.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
