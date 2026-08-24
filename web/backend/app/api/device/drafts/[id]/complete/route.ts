import { NextResponse } from "next/server";

import { createClaimCode } from "@/lib/server/claim-code";
import { requireDeviceUploadToken } from "@/lib/server/device-auth";
import { getDeviceDraft, isUniqueViolation, markDraftReady } from "@/lib/server/drafts";
import { headObject } from "@/lib/server/r2";
import { ApiError, handleRouteError, isUuid } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/device/drafts/{id}/complete:
 *   post:
 *     tags: [Device]
 *     summary: 確認原圖並取得 6 位領取碼
 *     security: [{ DeviceAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 草稿已可領取 }
 *       401: { description: DEVICE_UPLOAD_TOKEN 無效 }
 *       409: { description: 上傳尚未完成或狀態不允許 }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("DRAFT_NOT_FOUND", 404);
    requireDeviceUploadToken(request);
    let draft = await getDeviceDraft(id);
    if (draft.status === "ready" && draft.claimCode && draft.claimExpiresAt) {
      return NextResponse.json({
        draftId: draft.id,
        status: draft.status,
        claimCode: draft.claimCode,
        claimExpiresAt: draft.claimExpiresAt,
      });
    }
    if (draft.status !== "uploading" || !draft.originalKey || !draft.originalSize) {
      throw new ApiError("DRAFT_NOT_UPLOADABLE", 409);
    }
    let object;
    try {
      object = await headObject(draft.originalKey);
    } catch {
      throw new ApiError("ORIGINAL_NOT_UPLOADED", 409);
    }
    if (object.ContentLength !== draft.originalSize || object.ContentType !== "image/jpeg") {
      throw new ApiError("ORIGINAL_MISMATCH", 409);
    }

    const claimExpiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const ready = await markDraftReady(id, createClaimCode(), claimExpiresAt);
        if (ready) {
          return NextResponse.json({
            draftId: ready.id,
            status: ready.status,
            claimCode: ready.claimCode,
            claimExpiresAt: ready.claimExpiresAt,
          });
        }
        draft = await getDeviceDraft(id);
        if (draft.status === "ready" && draft.claimCode && draft.claimExpiresAt) {
          return NextResponse.json({
            draftId: draft.id,
            status: draft.status,
            claimCode: draft.claimCode,
            claimExpiresAt: draft.claimExpiresAt,
          });
        }
        throw new ApiError("DRAFT_COMPLETE_CONFLICT", 409);
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 7) throw error;
      }
    }
    throw new ApiError("CLAIM_CODE_CREATE_FAILED", 500);
  } catch (error) {
    return handleRouteError(error);
  }
}
