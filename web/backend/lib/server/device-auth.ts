import "server-only";

import { timingSafeEqual } from "node:crypto";

import { getDeviceUploadToken } from "@/lib/server/env";
import { ApiError, bearerToken } from "@/lib/server/validation";

export function requireDeviceUploadToken(request: Request) {
  const provided = Buffer.from(bearerToken(request));
  const expected = Buffer.from(getDeviceUploadToken());
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new ApiError("DEVICE_UNAUTHORIZED", 401);
  }
}
