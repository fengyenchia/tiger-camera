import "server-only";

import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJson(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new ApiError("INVALID_JSON", 400);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("INVALID_JSON", 400);
  }
}

export function requiredString(
  body: Record<string, unknown>,
  key: string,
  options: { max?: number; min?: number } = {},
) {
  const value = body[key];
  if (typeof value !== "string") throw new ApiError("INVALID_INPUT", 400);
  const normalized = value.trim();
  if (normalized.length < (options.min ?? 1) || normalized.length > (options.max ?? 500)) {
    throw new ApiError("INVALID_INPUT", 400);
  }
  return normalized;
}

export function optionalString(body: Record<string, unknown>, key: string, max = 500) {
  const value = body[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max) {
    throw new ApiError("INVALID_INPUT", 400);
  }
  return value.trim();
}

export function requiredInteger(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
) {
  const value = body[key];
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new ApiError("INVALID_INPUT", 400);
  }
  return value as number;
}

export function requiredBoolean(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "boolean") throw new ApiError("INVALID_INPUT", 400);
  return value;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function requiredUuid(body: Record<string, unknown>, key: string) {
  const value = requiredString(body, key, { max: 36, min: 36 });
  if (!isUuid(value)) throw new ApiError("INVALID_INPUT", 400);
  return value;
}

export function requiredIsoDate(body: Record<string, unknown>, key: string) {
  const value = requiredString(body, key, { max: 40 });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError("INVALID_INPUT", 400);
  return date.toISOString();
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]) throw new ApiError("UNAUTHORIZED", 401);
  return match[1].trim();
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ code: error.code }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  if (
    message.startsWith("MISSING_ENV_") ||
    message === "ADMIN_JWT_SECRET_TOO_SHORT" ||
    message === "DEVICE_UPLOAD_TOKEN_TOO_SHORT" ||
    message === "INVALID_API_PUBLIC_URL"
  ) {
    return NextResponse.json({ code: "SERVER_NOT_CONFIGURED" }, { status: 503 });
  }
  console.error("Tiger Camera API error", error);
  return NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 });
}
