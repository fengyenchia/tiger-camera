import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/admin-auth";
import { deletePhotoRecord, markPhotoDeleting } from "@/lib/server/photos";
import { deleteObject } from "@/lib/server/r2";
import { ApiError, handleRouteError, isUuid } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/photos/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: 管理員單次永久刪除完成圖與 metadata
 *     security: [{ AdminAuth: [] }]
 *     responses:
 *       204: { description: 已永久刪除 }
 *       401: { description: Admin JWT 無效 }
 *       404: { description: 照片不存在 }
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("PHOTO_NOT_FOUND", 404);
    const photo = await markPhotoDeleting(id);
    await deleteObject(photo.originalKey);
    await deleteObject(photo.processedKey);
    await deletePhotoRecord(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

