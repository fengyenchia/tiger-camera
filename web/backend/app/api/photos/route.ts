import { NextResponse } from "next/server";

import { listPublicPhotos } from "@/lib/server/photos";
import { handleRouteError } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/photos:
 *   get:
 *     tags: [Photos]
 *     summary: 列出所有公開完成圖
 *     responses:
 *       200: { description: 公開相簿 }
 */
export async function GET() {
  try {
    return NextResponse.json({ photos: await listPublicPhotos() });
  } catch (error) {
    return handleRouteError(error);
  }
}
