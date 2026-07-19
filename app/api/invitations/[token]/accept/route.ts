import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const prisma = db as any;

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  }) ?? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      {
        message:
          "User account could not be resolved for this session. Please sign out and sign back in.",
      },
      { status: 404 }
    );
  }

  const { token } = await context.params;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { message: "Invitation is not valid or has already been used." },
      { status: 404 }
    );
  }

  if (invite.status === "ACCEPTED") {
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
      select: { id: true },
    });

    if (existingMembership) {
      return NextResponse.json({
        message: `You have already joined ${invite.workspace.name}.`,
        workspaceId: invite.workspace.id,
      });
    }

    return NextResponse.json(
      { message: "This invitation has already been accepted." },
      { status: 409 }
    );
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json(
      { message: "This invitation is no longer available." },
      { status: 409 }
    );
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ message: "Invitation has expired." }, { status: 410 });
  }

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json(
      { message: "Sign in with the invited email to accept this invitation." },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: "MEMBER",
      },
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    message: `You have joined ${invite.workspace.name}.`,
    workspaceId: invite.workspace.id,
  });
}
