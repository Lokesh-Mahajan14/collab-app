import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/lib/validators/workspace";
import { createWorkspaceSlug } from "@/lib/workspace";

const prisma = db as any;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
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

  return NextResponse.json({
    workspaces: memberships.map((membership: any) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      memberCount: membership.workspace._count.members,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createWorkspaceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 }
    );
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug: createWorkspaceSlug(parsed.data.name),
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(
    {
      message: "Workspace created",
      workspace,
    },
    { status: 201 }
  );
}
