import { NextResponse } from "next/server";

import { getApiDocs } from "@/lib/server/swagger";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getApiDocs(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
