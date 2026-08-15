import { NextResponse } from "next/server";

import { requireClaim } from "@/lib/server/claim-auth";
import { createJpegGetUrl } from "@/lib/server/r2";
import { ApiError, handleRouteError } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/drafts/{id}/image:
 *   get:
 *     tags: [Drafts]
 *     summary: 取得私人原圖的短效 R2 下載網址
 *     security: [{ ClaimAuth: [] }]
 *     responses:
 *       307: { description: Redirect 到短效 R2 GET URL }
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
    return NextResponse.redirect(await createJpegGetUrl(draft.originalKey), {
      status: 307,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

