import { NextRequest, NextResponse } from "next/server";

import { addDemoPhoto } from "@/lib/server/demo-photo-store";
import type { PublishDraftInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authorization = request.headers.get("authorization");

  if (id !== "demo-draft-tiger1" || authorization !== "Bearer demo-claim-token-tiger1") {
    return NextResponse.json({ code: "INVALID_CLAIM_TOKEN" }, { status: 401 });
  }

  const input = (await request.json()) as Partial<PublishDraftInput>;
  if (!input.title || !input.processedUrl || !input.filterPreset) {
    return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  }

  const photo = addDemoPhoto({
    title: input.title,
    originalUrl: "/samples/photo-sunroom.svg",
    processedUrl: input.processedUrl,
    filterPreset: input.filterPreset,
  });

  return NextResponse.json({ photo }, { status: 201 });
}
