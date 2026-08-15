import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";

const prisma = db as any;


type RouteContext = {
  params: Promise<{
    workspaceId: string;
    documentId: string;
  }>;
};



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
              resource_type: "raw",
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