import { NextRequest, NextResponse } from "next/server";

import {
  addDemoPhoto,
  deleteDemoPhoto,
  getDemoPhotos,
} from "@/lib/server/demo-photo-store";
import type { CreatePhotoInput } from "@/api/types";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ photos: getDemoPhotos(), demoMode: true });
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as Partial<CreatePhotoInput>;
  if (!input.title || !input.originalUrl || !input.processedUrl || !input.filterPreset) {
    return NextResponse.json({ message: "照片資料不完整" }, { status: 400 });
  }

  const photo = addDemoPhoto(input as CreatePhotoInput);
  return NextResponse.json({ photo }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ message: "缺少照片 ID" }, { status: 400 });
  if (!deleteDemoPhoto(body.id)) {
    return NextResponse.json({ message: "找不到照片" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
