import { db } from "@/lib/db";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {

  const { id } =
    await params;

  const attachment =
    await db.messageAttachment.findUnique({
      where: {
        id,
      },
    });

  if (!attachment) {
    return new Response(
      "Not Found",
      {
        status: 404,
      },
    );
  }

  const upstreamResponse = await fetch(attachment.url);

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return new Response("Failed to download file", { status: 502 });
  }

  const safeFileName = attachment.fileName.replace(/\"/g, "");
  const encodedFileName = encodeURIComponent(attachment.fileName);

  const headers = new Headers({
    "Content-Type":
      upstreamResponse.headers.get("content-type") ??
      attachment.mimeType ??
      "application/octet-stream",
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
}