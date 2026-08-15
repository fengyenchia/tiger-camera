import "server-only";

import { randomUUID } from "node:crypto";

export function normalizeClaimCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function isClaimCode(value: string) {
  return /^[A-Z0-9]{6}$/.test(value);
}

export function createClaimCode() {
  return randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
}

export function createClaimToken() {
  return randomUUID();
}

