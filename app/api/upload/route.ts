// app/api/attachments/route.ts

import { NextResponse }
from "next/server";

import { cloudinary } from "@/lib/cloudinary";

export async function POST(
  req: Request
)
{
  const formData =
    await req.formData();

  const file =formData.get("file") as File;

  if (!file) {

    return NextResponse.json(
      {
        error:
          "File required",
      },
      {
        status: 400,
      }
    );

  }

  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  const result =
    await new Promise<any>(
      (
        resolve,
        reject
      ) => {

        cloudinary
          .uploader
          .upload_stream(

            {
              folder:
                "collab-app",

              resource_type:
                "auto",

              use_filename: true,

              unique_filename: false,

            },

            (
              error,
              result
            ) => {

              if (error) {
                reject(error);
              }

              resolve(result);
            }

          )
          .end(buffer);

      }
    );

  return NextResponse.json({

    url:
      result.secure_url,

    publicId:
      result.public_id,

    fileName:
      file.name,

    mimeType:
      file.type,

    size:
      file.size,

  });

}