import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AcceptInvitationCard } from "@/components/invitations/AcceptInvitationCard";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const prisma = db as any;

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationPage({ params }: InvitationPageProps) {
  const session = await getServerSession(authOptions);
  const { token } = await params;

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/invitations/${token}`);
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { name: true },
      },
    },
  });

  if (!invite || invite.status !== "PENDING") {
    return (
      <main className="min-h-screen bg-background px-4 py-20">
        <section className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Invitation not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation is invalid, expired, or already accepted.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <AcceptInvitationCard
        token={token}
        workspaceName={invite.workspace.name}
        invitedEmail={invite.email}
      />
    </main>
  );
}
