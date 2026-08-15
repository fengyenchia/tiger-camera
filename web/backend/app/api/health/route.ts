import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/health:
 *   get:
 *     operationId: getHealth
 *     summary: 檢查 Backend 是否正常運作
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Backend 正常
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [service, status]
 *               properties:
 *                 service:
 *                   type: string
 *                   example: tiger-camera-backend
 *                 status:
 *                   type: string
 *                   example: ok
 */
export function GET() {
  return NextResponse.json({ service: "tiger-camera-backend", status: "ok" });
}
