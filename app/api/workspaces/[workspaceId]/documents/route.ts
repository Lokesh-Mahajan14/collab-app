import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";

const prisma = db as any;

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

function uploadToCloudinary(file: File, workspaceId: string) {
  return file.arrayBuffer().then(
    (bytes) =>
      new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `collab-app/workspaces/${workspaceId}/documents`,
              resource_type: "raw",
              use_filename: true,
              unique_filename: false,
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              resolve(result);
            }
          )
          .end(Buffer.from(bytes));
      })
  );
}

async function getAuthorizedWorkspace(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
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
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getAuthorizedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const documents = await prisma.workspaceDocument.findMany({
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

    return NextResponse.json({
      workspace,
      documents,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getAuthorizedWorkspace(workspaceId, session.user.id);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const titleValue = formData.get("title");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }

      const uploadResult = await uploadToCloudinary(file, workspaceId);
      const title = typeof titleValue === "string" && titleValue.trim().length > 0 ? titleValue.trim() : file.name;

      const document = await prisma.workspaceDocument.create({
        data: {
          workspaceId,
          uploadedById: session.user.id,
          type: "FILE",
          title,
          url: uploadResult.secure_url,
          fileName: file.name,
          publicId: uploadResult.public_id,
          mimeType: file.type || uploadResult.resource_type || "application/octet-stream",
          size: file.size,
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

      return NextResponse.json({ document }, { status: 201 });
    }

    const body = await request.json();
    const type = typeof body.type === "string" ? body.type : "LINK";

    if (type !== "LINK") {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
    }

    const document = await prisma.workspaceDocument.create({
      data: {
        workspaceId,
        uploadedById: session.user.id,
        type: "LINK",
        title,
        url,
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

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}