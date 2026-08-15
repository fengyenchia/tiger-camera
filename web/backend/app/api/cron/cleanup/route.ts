import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/server/env";
import {
  clearPublishedOriginal,
  deleteExpiredDraftRecord,
  deletePhotoRecord,
  listCleanupCandidates,
} from "@/lib/server/photos";
import { deleteObject } from "@/lib/server/r2";
import { ApiError, bearerToken, handleRouteError } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/cron/cleanup:
 *   get:
 *     tags: [Maintenance]
 *     summary: 清理逾期草稿、待刪照片與公開後暫存原圖
 *     responses:
 *       200: { description: 清理批次完成 }
 *       401: { description: CRON_SECRET 無效 }
 */
export async function GET(request: Request) {
  try {
    if (bearerToken(request) !== getCronSecret()) throw new ApiError("CRON_UNAUTHORIZED", 401);
    const candidates = await listCleanupCandidates();
    const failed: string[] = [];
    let cleaned = 0;
    for (const photo of candidates) {
      try {
        if (photo.status === "active") {
          await deleteObject(photo.originalKey);
          await clearPublishedOriginal(photo.id);
        } else if (photo.status === "deleting") {
          await deleteObject(photo.originalKey);
          await deleteObject(photo.processedKey);
          await deletePhotoRecord(photo.id);
        } else {
          await deleteObject(photo.originalKey);
          await deleteObject(photo.processedKey);
          await deleteExpiredDraftRecord(photo.id);
        }
        cleaned += 1;
      } catch {
        failed.push(photo.id);
      }
    }
    return NextResponse.json({ scanned: candidates.length, cleaned, failed });
  } catch (error) {
    return handleRouteError(error);
  }
}

