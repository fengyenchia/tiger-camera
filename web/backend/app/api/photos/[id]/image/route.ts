import { NextResponse } from "next/server";

import { getPublicPhotoObject } from "@/lib/server/photos";
import { createJpegGetUrl, getJpegObject } from "@/lib/server/r2";
import { ApiError, handleRouteError, isUuid } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/photos/{id}/image:
 *   get:
 *     tags: [Photos]
 *     summary: 讀取公開完成圖
 *     parameters:
 *       - in: query
 *         name: download
 *         schema: { type: string, enum: ["1"] }
 *         description: 設為 1 時以 JPEG 附件下載
 *     responses:
 *       200: { description: download=1 時直接傳回 JPEG 附件 }
 *       307: { description: Redirect 到短效 R2 GET URL }
 *       404: { description: 照片不存在 }
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("PHOTO_NOT_FOUND", 404);
    const photo = await getPublicPhotoObject(id);
    if (!photo.processedKey) throw new ApiError("PHOTO_NOT_FOUND", 404);
    const download = new URL(request.url).searchParams.get("download") === "1";

    if (download) {
      const object = await getJpegObject(photo.processedKey);
      if (!object.Body) throw new ApiError("PHOTO_NOT_FOUND", 404);
      const bytes = await object.Body.transformToByteArray();
      return new Response(Buffer.from(bytes), {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60",
          "Content-Disposition": `attachment; filename="tiger-camera-${photo.id}.jpg"`,
          "Content-Length": String(bytes.byteLength),
          "Content-Type": "image/jpeg",
        },
      });
    }

    return NextResponse.redirect(await createJpegGetUrl(photo.processedKey), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
