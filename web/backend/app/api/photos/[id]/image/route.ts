import { NextResponse } from "next/server";

import { getPublicPhotoObject } from "@/lib/server/photos";
import { createJpegGetUrl } from "@/lib/server/r2";
import { ApiError, handleRouteError, isUuid } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/photos/{id}/image:
 *   get:
 *     tags: [Photos]
 *     summary: 讀取公開完成圖
 *     responses:
 *       307: { description: Redirect 到短效 R2 GET URL }
 *       404: { description: 照片不存在 }
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("PHOTO_NOT_FOUND", 404);
    const photo = await getPublicPhotoObject(id);
    if (!photo.processedKey) throw new ApiError("PHOTO_NOT_FOUND", 404);
    return NextResponse.redirect(await createJpegGetUrl(photo.processedKey), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

