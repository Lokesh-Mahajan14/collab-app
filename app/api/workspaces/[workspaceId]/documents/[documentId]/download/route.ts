import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { error } from "console";
import { Select } from "radix-ui";
import { cloudinary } from "@/lib/cloudinary";

const prisma = db as any;

type RouteContext = {
  params: Promise<{
    workspaceId: string;
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { workspaceId, documentId } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const document = await prisma.workspaceDocument.findFirst({
      where: {
        id: documentId,
        workspaceId,
        type: "FILE",
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        mimeType: true,
        url: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const upstreamResponse = await fetch(document.url);

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 502 });
    }

    const safeFileName = (document.fileName ?? document.title).replace(/\"/g, "");
    const encodedFileName = encodeURIComponent(document.fileName ?? document.title);

    const headers = new Headers({
      "Content-Type": upstreamResponse.headers.get("content-type") ?? document.mimeType ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
    });

    const contentLength = upstreamResponse.headers.get("content-length");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

export async function DELETE(_request:Request,context:RouteContext) {
    try{
        const session=await getServerSession(authOptions);

        const {workspaceId,documentId}=await context.params

        if(!session?.user?.id){
            return NextResponse.json(
                {error:"Unauthorised"},
                {status:401},
            )
        }

        const workspace=await prisma.workspace.findFirst({
            where:{
                id:workspaceId,
                members:{
                    some:{
                        userId:session.user.id,
                    },
                },
            },
            select:{
                id:true,
            }

        });
        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 },
            );
        }
        const document = await prisma.workspaceDocument.findFirst({
            where: {
                id: documentId,
                workspaceId,
            },
            select: {
                id: true,
                type: true,
                uploadedById: true,
                publicId: true,
            },
        });
        if (!document) {
          return NextResponse.json(
            { error: "Document not found" },
            { status: 404 },
          );
        }
        if (document.uploadedById !== session.user.id) {
          return NextResponse.json(
            { error: "You can only delete documents uploaded by you" },
            { status: 403 },
          );
        }
        if (document.type === "FILE" && document.publicId) {
          try {
            await cloudinary.uploader.destroy(document.publicId, {
              resource_type: "auto",
            });
          } catch (cloudinaryError) {
            console.error(
              "Failed to delete file from Cloudinary:",
              cloudinaryError,
            );

            return NextResponse.json(
              { error: "Failed to delete file from storage" },
              { status: 500 },
            );
          }
        }
        await prisma.workspaceDocument.delete({
          where: {
            id: documentId,
          },
        });

        return NextResponse.json(
          {
            message: "Document deleted successfully",
            documentId,
          },
          { status: 200 },
        );
    }catch(error){
      console.error("Delete document error:", error);

    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );

    }
}