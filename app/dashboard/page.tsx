import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  MessageSquare,
  FileText,
  BarChart3,
  Users,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Topbar } from "@/components/layout/Topbar";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceSidebarItems } from "@/lib/workspace";
import { Button } from "@/components/ui/Button";

import { getCached, setCached } from "@/lib/redis";

type DashboardPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    new?: string;
  }>;
};

async function getDashboardWorkspace(workspaceId: string) {
  const cacheKey = `dashboard:workspace:${workspaceId}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const data = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
          status: true,
          priority: true,
          dueDate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
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
      _count: {
        select: {
          tasks: true,
          members: true,
          documents: true,
          conversations: true,
        },
      },
    },
  });

  if (data) {
    await setCached(cacheKey, data, 30);
  }

  return data;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;

  if (!session?.user?.id || !session.user.email) {
    redirect("/auth/login");
  }

  const requestedWorkspaceId = resolvedSearchParams?.workspace;

  // Run sidebar items and requested workspace concurrently
  const [workspaceOptions, requestedWorkspace] = await Promise.all([
    getWorkspaceSidebarItems(session.user.id),
    requestedWorkspaceId ? getDashboardWorkspace(requestedWorkspaceId) : Promise.resolve(null),
  ]);

  const selectedWorkspaceId =
    requestedWorkspaceId && workspaceOptions.some((w) => w.id === requestedWorkspaceId)
      ? requestedWorkspaceId
      : workspaceOptions[0]?.id;

  const selectedWorkspace =
    selectedWorkspaceId === requestedWorkspaceId
      ? requestedWorkspace
      : selectedWorkspaceId
      ? await getDashboardWorkspace(selectedWorkspaceId)
      : null;

  return (
    <WorkspaceShell
      workspaces={workspaceOptions}
      currentWorkspaceId={selectedWorkspaceId}
      userName={session.user.name ?? "User"}
      userEmail={session.user.email}
      openCreateByDefault={resolvedSearchParams?.new === "workspace"}
    >
      <Topbar
        workspaceName={selectedWorkspace?.name}
        workspaceId={selectedWorkspaceId}
        currentPageTitle="Dashboard"
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {selectedWorkspace ? (
          <div className="space-y-6">
            {/* Welcome banner */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Workspace Hub
                    </p>
                  </div>
                  <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Welcome to {selectedWorkspace.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                    {selectedWorkspace.description ||
                      "Collaborate on tasks, coordinate projects, discuss in real-time channels, and organize documents."}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button asChild className="gap-2 shadow-xs text-xs h-9">
                    <Link href={`/workspace/${selectedWorkspace.id}/projects`}>
                      <FolderKanban className="w-4 h-4" />
                      View Projects
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Quick Navigation Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={`/workspace/${selectedWorkspace.id}/projects`}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Projects Board</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedWorkspace._count.tasks} total task(s) on board
                </p>
              </Link>

              <Link
                href={`/workspace/${selectedWorkspace.id}/tasks?mine=true`}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">My Assigned Tasks</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View and manage your tasks
                </p>
              </Link>

              <Link
                href={`/workspace/${selectedWorkspace.id}/chat`}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Team Messages</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedWorkspace._count.conversations} active conversation(s)
                </p>
              </Link>

              <Link
                href={`/workspace/${selectedWorkspace.id}/files`}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Workspace Files</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedWorkspace._count.documents} document(s) uploaded
                </p>
              </Link>
            </section>

            {/* Members & Recent Tasks */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Members */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Members</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedWorkspace.members.length} member(s) in this workspace
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="text-xs h-8">
                    <Link href={`/dashboard/members?workspace=${selectedWorkspace.id}`}>
                      View all
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {(selectedWorkspace.members ?? []).map((member: any) => (
                    <div
                      key={member.user?.id ?? member.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {member.user?.name ? member.user.name.slice(0, 1).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.user?.name ?? "User"}</p>
                          <p className="text-[11px] text-muted-foreground">{member.user?.email}</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Invitations */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Pending Invitations</h2>
                    <p className="text-xs text-muted-foreground">
                      {(selectedWorkspace.invites ?? []).length} pending invitation(s)
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="text-xs h-8">
                    <Link href={`/dashboard/members?workspace=${selectedWorkspace.id}`}>
                      Manage
                    </Link>
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {(selectedWorkspace.invites ?? []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-xs text-muted-foreground">
                      No pending invitations. Invite colleagues using the sidebar.
                    </div>
                  ) : (
                    (selectedWorkspace.invites ?? []).map((invite: any) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs"
                      >
                        <p className="font-medium text-foreground">{invite.email}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section className="rounded-3xl border border-border/80 bg-card p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create your first workspace
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Set up a dedicated workspace to collaborate with teammates, organize project tasks, and start conversations.
            </p>
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
