import { NextResponse } from "next/server";

import { requireClaim } from "@/lib/server/claim-auth";
import { assignProcessedKey } from "@/lib/server/drafts";
import { createJpegPutUrl, finishedObjectKey } from "@/lib/server/r2";
import { handleRouteError, readJson, requiredInteger } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/drafts/{id}/process/initiate:
 *   post:
 *     tags: [Drafts]
 *     summary: 取得完成圖 R2 PUT URL
 *     security: [{ ClaimAuth: [] }]
 *     responses:
 *       200: { description: 回傳五分鐘有效的 PUT URL }
 *       401: { description: Claim token 無效 }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { token } = await requireClaim(request, id);
    const body = await readJson(request);
    const processedSize = requiredInteger(body, "processedSize", 1, 12 * 1024 * 1024);
    const key = finishedObjectKey(id);
    await assignProcessedKey(id, token, key, processedSize);
    return NextResponse.json({
      upload: {
        url: await createJpegPutUrl(key),
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
      },
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

