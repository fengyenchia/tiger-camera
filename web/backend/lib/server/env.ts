import "server-only";

type R2Env = {
  r2AccessKeyId: string;
  r2BucketName: string;
  r2Endpoint: string;
  r2Region: string;
  r2SecretAccessKey: string;
};

type AdminEnv = {
  passwordHash: string;
  secret: string;
  username: string;
};

function requireValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_ENV_${name}`);
  return value;
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getDatabaseUrl() {
  return requireValue("DATABASE_URL");
}

export function getR2Env(): R2Env {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const configuredEndpoint = process.env.R2_ENDPOINT?.trim();
  const r2Endpoint = configuredEndpoint ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  if (!r2Endpoint) throw new Error("MISSING_ENV_R2_ENDPOINT");

  return {
    r2AccessKeyId: requireValue("R2_ACCESS_KEY_ID"),
    r2BucketName: requireValue("R2_BUCKET_NAME"),
    r2Endpoint: normalizeUrl(r2Endpoint),
    r2Region: process.env.R2_REGION?.trim() || "auto",
    r2SecretAccessKey: requireValue("R2_SECRET_ACCESS_KEY"),
  };
}

export function getAdminEnv(): AdminEnv {
  const secret = requireValue("ADMIN_JWT_SECRET");
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("ADMIN_JWT_SECRET_TOO_SHORT");
  }
  return {
    passwordHash: requireValue("ADMIN_PASSWORD_HASH"),
    secret,
    username: requireValue("ADMIN_USERNAME"),
  };
}

export function getCronSecret() {
  return requireValue("CRON_SECRET");
}

export function getDeviceUploadToken() {
  const token = requireValue("DEVICE_UPLOAD_TOKEN");
  if (new TextEncoder().encode(token).byteLength < 32) {
    throw new Error("DEVICE_UPLOAD_TOKEN_TOO_SHORT");
  }
  return token;
}

export function getApiUrl(path: string) {
  const base = normalizeUrl(process.env.API_PUBLIC_URL?.trim() || "http://localhost:3001");
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error("INVALID_API_PUBLIC_URL");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error("INVALID_API_PUBLIC_URL");
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
