import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWorkspaceInviteEmail } from "@/lib/mailer";
import { inviteMemberSchema } from "@/lib/validators/workspace";
import { createInviteToken } from "@/lib/workspace";

const prisma = db as any;

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
    include: {
      workspace: {
        select: { id: true, name: true },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = inviteMemberSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: existingUser.id,
          workspaceId,
        },
      },
      select: { id: true },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "This user is already a member of the workspace." },
        { status: 409 }
      );
    }
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const existingPendingInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      email,
      status: "PENDING",
    },
    select: { id: true },
  });

  const invite = existingPendingInvite
    ? await prisma.workspaceInvite.update({
        where: { id: existingPendingInvite.id },
        data: {
          token,
          invitedById: session.user.id,
          expiresAt,
          acceptedAt: null,
        },
        select: {
          id: true,
          email: true,
          token: true,
          workspace: {
            select: { name: true },
          },
        },
      })
    : await prisma.workspaceInvite.create({
        data: {
          email,
          token,
          workspaceId,
          invitedById: session.user.id,
          expiresAt,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          token: true,
          workspace: {
            select: { name: true },
          },
        },
      });

  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL;
  const inviteLink = `${origin}/invitations/${invite.token}`;

  const emailResult = await sendWorkspaceInviteEmail({
    to: invite.email,
    workspaceName: invite.workspace.name,
    inviterName: session.user.name ?? session.user.email,
    inviteLink,
  });

  const emailWarning = emailResult.delivered
    ? undefined
    : emailResult.provider === "resend"
      ? "Resend rejected this recipient in testing mode. Verify a domain in Resend or share the invite link manually."
      : emailResult.provider === "smtp"
        ? "SMTP delivery failed for this recipient. Check SMTP credentials or share the invite link manually."
        : "Email provider is not configured. Share the invite link manually.";

  return NextResponse.json(
    {
      message: emailResult.delivered ? "Invitation sent" : "Invitation created, but email delivery was not available",
      inviteLink,
      invitationId: invite.id,
      emailDelivered: emailResult.delivered,
      emailWarning,
    },
    { status: 201 }
  );
}
