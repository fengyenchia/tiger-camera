import { NextResponse } from "next/server";

import {
  createClaimToken,
  isClaimCode,
  normalizeClaimCode,
} from "@/lib/server/claim-code";
import { claimDraftByCode } from "@/lib/server/drafts";
import { getApiUrl } from "@/lib/server/env";
import { ApiError, handleRouteError, readJson, requiredString } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/drafts/claim:
 *   post:
 *     tags: [Drafts]
 *     summary: 使用 6 位配對碼領取單張私人草稿
 *     responses:
 *       200: { description: 領取成功並取得 UUID Bearer token }
 *       400: { description: 領取碼格式錯誤 }
 *       404: { description: 領取碼不存在、已用或已過期 }
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const code = normalizeClaimCode(requiredString(body, "code", { max: 12 }));
    if (!isClaimCode(code)) throw new ApiError("INVALID_CLAIM_CODE", 400);
    const token = createClaimToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const draft = await claimDraftByCode(code, token, expiresAt);
    return NextResponse.json({
      draft: {
        id: draft.id,
        claimToken: token,
        originalUrl: getApiUrl(`/api/drafts/${draft.id}/image`),
        capturedAt: draft.capturedAt,
        expiresAt,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
