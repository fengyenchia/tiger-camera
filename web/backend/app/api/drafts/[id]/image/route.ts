import { requireClaim } from "@/lib/server/claim-auth";
import { getJpegObject } from "@/lib/server/r2";
import { ApiError, handleRouteError } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/drafts/{id}/image:
 *   get:
 *     tags: [Drafts]
 *     summary: 由 Backend 驗證 claim token 後傳回私人原圖
 *     security: [{ ClaimAuth: [] }]
 *     responses:
 *       200: { description: JPEG 原圖 }
 *       401: { description: Claim token 無效 }
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { draft } = await requireClaim(request, id);
    if (!draft.originalKey) throw new ApiError("ORIGINAL_NOT_FOUND", 404);
    const object = await getJpegObject(draft.originalKey);
    if (!object.Body) throw new ApiError("ORIGINAL_NOT_FOUND", 404);
    const bytes = await object.Body.transformToByteArray();
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "Content-Length": String(bytes.byteLength),
        "Content-Type": "image/jpeg",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
