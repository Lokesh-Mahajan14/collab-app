import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

import WorkspaceFilesClient from "@/components/workspace/WorkspaceFilesClient";

type WorkspaceFilesQueryResult = {
  workspace: {
    id: string;
    name: string;
    members: Array<{ id: string }>;
  };
  documents: Array<{
    id: string;
    type: "FILE" | "LINK";
    title: string;
    url: string;
    fileName: string | null;
    mimeType: string | null;
    size: number | null;
    createdAt: Date;
    uploadedBy: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
};

async function getWorkspaceFiles(
  workspaceId: string,
  userId: string
): Promise<WorkspaceFilesQueryResult | null> {
  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      members: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  const documents = await db.workspaceDocument.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      type: true,
      title: true,
      url: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    workspace,
    documents,
  };
}

export default async function WorkspaceFilesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const workspaceData = await getWorkspaceFiles(workspaceId, session.user.id);

  if (!workspaceData) {
    notFound();
  }

  const documents = workspaceData.documents.map((document) => ({
    id: document.id,
    type: document.type,
    title: document.title,
    url: document.url,
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size,
    createdAt: document.createdAt.toISOString(),
    uploadedBy: {
      id: document.uploadedBy.id,
      name: document.uploadedBy.name,
      email: document.uploadedBy.email,
    },
  }));

  return (
    <WorkspaceFilesClient
      userId={session.user.id}
      workspaceId={workspaceData.workspace.id}
      workspaceName={workspaceData.workspace.name}
      memberCount={workspaceData.workspace.members.length}
      documents={documents}
    />
  );
}