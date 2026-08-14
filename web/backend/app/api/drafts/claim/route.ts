import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DEMO_CODE = "TIGER1";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string };
  const code = body.code?.trim().toUpperCase();

  if (!code || !/^[A-Z0-9]{6,8}$/.test(code)) {
    return NextResponse.json({ code: "INVALID_CLAIM_CODE" }, { status: 400 });
  }
  if (code !== DEMO_CODE) {
    return NextResponse.json({ code: "CLAIM_CODE_NOT_FOUND" }, { status: 404 });
  }

  const now = Date.now();
  return NextResponse.json({
    draft: {
      id: "demo-draft-tiger1",
      claimToken: "demo-claim-token-tiger1",
      originalUrl: "/samples/photo-sunroom.svg",
      capturedAt: new Date(now - 90_000).toISOString(),
      expiresAt: new Date(now + 30 * 60_000).toISOString(),
      demoMode: true,
    },
  });
}
