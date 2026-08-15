import { NextResponse } from "next/server";

import { loginAdmin } from "@/lib/server/admin-auth";
import { handleRouteError, readJson, requiredString } from "@/lib/server/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: 管理員登入並取得 30 分鐘 JWT
 *     responses:
 *       200: { description: 登入成功 }
 *       401: { description: 帳號或密碼錯誤 }
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const token = await loginAdmin(
      requiredString(body, "username", { max: 80 }),
      requiredString(body, "password", { max: 200 }),
    );
    return NextResponse.json({ token, expiresIn: 1800 });
  } catch (error) {
    return handleRouteError(error);
  }
}

