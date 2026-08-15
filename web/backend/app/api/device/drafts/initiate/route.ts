import { NextResponse } from "next/server";

import { requireDevice } from "@/lib/server/device-auth";
import { createOrGetUploadingDraft } from "@/lib/server/drafts";
import { createJpegPutUrl } from "@/lib/server/r2";
import {
  ApiError,
  handleRouteError,
  readJson,
  requiredInteger,
  requiredIsoDate,
  requiredString,
  requiredUuid,
} from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/device/drafts/initiate:
 *   post:
 *     tags: [Device]
 *     summary: 建立私人原圖草稿並取得 R2 PUT URL
 *     security: [{ DeviceAuth: [] }]
 *     responses:
 *       201: { description: 草稿已建立 }
 *       400: { description: 輸入格式錯誤 }
 *       401: { description: Device credential 無效 }
 */
export async function POST(request: Request) {
  try {
    const device = await requireDevice(request);
    const body = await readJson(request);
    const clientRequestId = requiredUuid(body, "clientRequestId");
    const capturedAt = requiredIsoDate(body, "capturedAt");
    const mimeType = requiredString(body, "mimeType", { max: 40 });
    const width = requiredInteger(body, "width", 1, 8_000);
    const height = requiredInteger(body, "height", 1, 8_000);
    const originalSize = requiredInteger(body, "originalSize", 1, 8 * 1024 * 1024);
    if (mimeType !== "image/jpeg" || width * height > 40_000_000) {
      throw new ApiError("INVALID_IMAGE", 400);
    }
    const capturedTime = new Date(capturedAt).getTime();
    if (capturedTime > Date.now() + 5 * 60_000 || capturedTime < Date.now() - 30 * 24 * 60 * 60_000) {
      throw new ApiError("INVALID_CAPTURE_TIME", 400);
    }

    const draft = await createOrGetUploadingDraft(device.id, {
      capturedAt,
      clientRequestId,
      height,
      mimeType: "image/jpeg",
      originalSize,
      width,
    });
    if (!draft.originalKey) throw new ApiError("DRAFT_OBJECT_KEY_MISSING", 500);
    const url = await createJpegPutUrl(draft.originalKey);
    return NextResponse.json(
      {
        draftId: draft.id,
        upload: { url, method: "PUT", headers: { "Content-Type": "image/jpeg" } },
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

