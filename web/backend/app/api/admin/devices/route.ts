import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/admin-auth";
import { createDevice, listDevices } from "@/lib/server/device-auth";
import { handleRouteError, readJson, requiredString } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/admin/devices:
 *   get:
 *     tags: [Admin]
 *     summary: 列出裝置
 *     security: [{ AdminAuth: [] }]
 *     responses:
 *       200: { description: 裝置列表 }
 *   post:
 *     tags: [Admin]
 *     summary: 建立裝置並只回傳一次 credential
 *     security: [{ AdminAuth: [] }]
 *     responses:
 *       201: { description: 裝置已建立 }
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ devices: await listDevices() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await readJson(request);
    const result = await createDevice(requiredString(body, "name", { max: 80 }));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

