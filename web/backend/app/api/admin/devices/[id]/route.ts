import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/admin-auth";
import { setDeviceStatus } from "@/lib/server/device-auth";
import { ApiError, handleRouteError, isUuid, readJson, requiredString } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/admin/devices/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: 撤銷或重新啟用裝置 credential
 *     security: [{ AdminAuth: [] }]
 *     responses:
 *       200: { description: 裝置狀態已更新 }
 *       401: { description: Admin JWT 無效 }
 *       404: { description: 裝置不存在 }
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!isUuid(id)) throw new ApiError("DEVICE_NOT_FOUND", 404);
    const body = await readJson(request);
    const status = requiredString(body, "status", { max: 10 });
    if (status !== "active" && status !== "revoked") {
      throw new ApiError("INVALID_INPUT", 400);
    }
    return NextResponse.json({ device: await setDeviceStatus(id, status) });
  } catch (error) {
    return handleRouteError(error);
  }
}
