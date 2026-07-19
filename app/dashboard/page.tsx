import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type DashboardPageProps = {
	searchParams?: Promise<{
		workspace?: string;
		new?: string;
	}>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
	const session = await getServerSession(authOptions);
	const resolvedSearchParams = await searchParams;

	if (!session?.user?.id || !session.user.email) {
		redirect("/auth/login");
	}

	const memberships = await db.workspaceMember.findMany({
		where: { userId: session.user.id },
		select: {
			role: true,
			workspace: {
				select: {
					id: true,
					name: true,
					_count: {
						select: { members: true },
					},
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	const workspaceOptions = memberships.map((membership) => ({
		id: membership.workspace.id,
		name: membership.workspace.name,
		role: membership.role,
		memberCount: membership.workspace._count.members,
	}));

	const selectedWorkspaceId =
		resolvedSearchParams?.workspace && workspaceOptions.some((workspace) => workspace.id === resolvedSearchParams.workspace)
			? resolvedSearchParams.workspace
			: workspaceOptions[0]?.id;

	const selectedWorkspace = selectedWorkspaceId
		? await db.workspace.findUnique({
				where: { id: selectedWorkspaceId },
				select: {
					id: true,
					name: true,
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
			})
		: null;

	return (
		<main className="min-h-screen bg-background">
			<div className="flex min-h-screen">
				<Sidebar
					workspaces={workspaceOptions}
					currentWorkspaceId={selectedWorkspaceId}
					userName={session.user.name ?? "User"}
					userEmail={session.user.email}
					openCreateByDefault={resolvedSearchParams?.new === "workspace"}
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					<Topbar workspaceName={selectedWorkspace?.name} />

					<div className="flex-1 p-6">
						{selectedWorkspace ? (
							<div className="space-y-6">
								<section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
										Workspace Overview
									</p>
									<h1 className="mt-2 text-3xl font-semibold tracking-tight">
										{selectedWorkspace.name}
									</h1>
									<p className="mt-2 text-sm text-muted-foreground">
										Create a workspace from the sidebar, then invite members by email. Accepted invites are automatically added to this workspace.
									</p>
								</section>

								<section className="grid gap-6 lg:grid-cols-2">
									<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
										<h2 className="text-lg font-semibold">Members</h2>
										<p className="mt-1 text-sm text-muted-foreground">
											{selectedWorkspace.members.length} member(s) in this workspace
										</p>
										<div className="mt-4 space-y-3">
											{selectedWorkspace.members.map((member) => (
												<div
													key={member.user.id}
													className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-3 py-2"
												>
													<div>
														<p className="text-sm font-medium">{member.user.name ?? "Unnamed user"}</p>
														<p className="text-xs text-muted-foreground">{member.user.email}</p>
													</div>
													<span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
														{member.role}
													</span>
												</div>
											))}
										</div>
									</div>

									<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
										<h2 className="text-lg font-semibold">Pending Invitations</h2>
										<p className="mt-1 text-sm text-muted-foreground">
											{selectedWorkspace.invites.length} pending invitation(s)
										</p>
										<div className="mt-4 space-y-3">
											{selectedWorkspace.invites.length === 0 ? (
												<p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
													No pending invitations yet.
												</p>
											) : (
												selectedWorkspace.invites.map((invite) => (
													<div
														key={invite.id}
														className="rounded-xl border border-border/80 bg-background px-3 py-2"
													>
														<p className="text-sm font-medium">{invite.email}</p>
														<p className="text-xs text-muted-foreground">
															Expires on {invite.expiresAt.toLocaleDateString()}
														</p>
													</div>
												))
											)}
										</div>
									</div>
								</section>
							</div>
						) : (
							<section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
								<h1 className="text-2xl font-semibold">Create your first workspace</h1>
								<p className="mt-2 text-sm text-muted-foreground">
									Use the workspace switcher in the sidebar and click New workspace to get started.
								</p>
							</section>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
