import { NextResponse } from "next/server";

import { requireClaim } from "@/lib/server/claim-auth";
import { clearOriginalKey, publishDraftRecord } from "@/lib/server/drafts";
import { deleteObject, headObject } from "@/lib/server/r2";
import {
  ApiError,
  handleRouteError,
  optionalString,
  readJson,
  requiredBoolean,
  requiredInteger,
  requiredString,
} from "@/lib/server/validation";
import type { FilterPreset, PublishDraftInput, TextMode } from "@/lib/types";

export const runtime = "nodejs";

const filters = new Set<FilterPreset>([
  "none",
  "tiger-film",
  "baby-tiger",
  "night-hunter",
  "mono-mochi",
  "neon-party",
  "sunny-milk",
  "candy-pop",
  "lavender-dream",
]);
const textModes = new Set<TextMode>(["custom", "default", "none"]);

/**
 * @swagger
 * /api/drafts/{id}/publish:
 *   post:
 *     tags: [Drafts]
 *     summary: 驗證完成圖並公開該張照片
 *     security: [{ ClaimAuth: [] }]
 *     responses:
 *       201: { description: 照片已公開 }
 *       401: { description: Claim token 無效 }
 *       409: { description: 完成圖未上傳或草稿狀態衝突 }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { draft, token } = await requireClaim(request, id);
    if (!draft.processedKey) throw new ApiError("PROCESSED_NOT_INITIATED", 409);

    const body = await readJson(request);
    const filterPreset = requiredString(body, "filterPreset", { max: 30 }) as FilterPreset;
    const textMode = requiredString(body, "textMode", { max: 10 }) as TextMode;
    if (!filters.has(filterPreset) || !textModes.has(textMode)) {
      throw new ApiError("INVALID_PROCESSING_OPTIONS", 400);
    }
    const input: PublishDraftInput = {
      title: requiredString(body, "title", { max: 80 }),
      width: requiredInteger(body, "width", 1, 8_000),
      height: requiredInteger(body, "height", 1, 8_000),
      processedSize: requiredInteger(body, "processedSize", 1, 12 * 1024 * 1024),
      frameEnabled: requiredBoolean(body, "frameEnabled"),
      timestampEnabled: requiredBoolean(body, "timestampEnabled"),
      textMode,
      customText: optionalString(body, "customText", 40),
      resolvedText: optionalString(body, "resolvedText", 40),
      filterPreset,
      processingVersion: requiredString(body, "processingVersion", { max: 40 }),
    };
    if (input.width * input.height > 40_000_000) throw new ApiError("INVALID_IMAGE", 400);
    if (
      (textMode === "none" && (input.customText || input.resolvedText)) ||
      (textMode === "custom" && (!input.customText || input.resolvedText !== input.customText)) ||
      (textMode === "default" && (input.customText || !input.resolvedText))
    ) {
      throw new ApiError("INVALID_TEXT_OPTIONS", 400);
    }

    let object;
    try {
      object = await headObject(draft.processedKey);
    } catch {
      throw new ApiError("PROCESSED_NOT_UPLOADED", 409);
    }
    if (object.ContentLength !== input.processedSize || object.ContentType !== "image/jpeg") {
      throw new ApiError("PROCESSED_MISMATCH", 409);
    }

    const photo = await publishDraftRecord(id, token, input);
    if (draft.originalKey) {
      try {
        await deleteObject(draft.originalKey);
        await clearOriginalKey(id);
      } catch (error) {
        console.error("Temporary original cleanup deferred", { photoId: id, error });
      }
    }
    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
