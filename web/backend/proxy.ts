import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://tiger-camera.fengyenchia.com",
  ...configuredOrigins,
]);

const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.has(origin);

  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      return NextResponse.json({ code: "ORIGIN_NOT_ALLOWED" }, { status: 403 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
      },
    });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  response.headers.set("Vary", "Origin");
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
