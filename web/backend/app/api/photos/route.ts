import { NextResponse } from "next/server";

import { getDemoPhotos } from "@/lib/server/demo-photo-store";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ photos: getDemoPhotos(), demoMode: true });
}
