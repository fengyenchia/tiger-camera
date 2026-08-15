import "server-only";

import { compare } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

import { getAdminEnv } from "@/lib/server/env";
import { ApiError, bearerToken } from "@/lib/server/validation";

const issuer = "tiger-camera";
const audience = "tiger-camera-admin";

function secretKey() {
  return new TextEncoder().encode(getAdminEnv().secret);
}

export async function loginAdmin(username: string, password: string) {
  const env = getAdminEnv();
  const usernameMatches = username === env.username;
  const passwordMatches = await compare(password, env.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    throw new ApiError("ADMIN_LOGIN_FAILED", 401);
  }
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(env.username)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secretKey());
}

export async function requireAdmin(request: Request) {
  const token = bearerToken(request);
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer,
      audience,
    });
    if (payload.role !== "admin") throw new Error("INVALID_ROLE");
    return payload;
  } catch {
    throw new ApiError("ADMIN_UNAUTHORIZED", 401);
  }
}
