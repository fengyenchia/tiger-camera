import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { query } from "@/lib/server/db";
import { ApiError, bearerToken } from "@/lib/server/validation";
import type { Device } from "@/lib/types";

type DeviceRow = Device & {
  createdAt?: string;
  lastSeenAt?: string | null;
};

export function hashDeviceCredential(credential: string) {
  return createHash("sha256").update(credential).digest("hex");
}

export function createDeviceCredential() {
  return randomBytes(32).toString("base64url");
}

export async function requireDevice(request: Request) {
  const credential = bearerToken(request);
  if (credential.length < 32 || credential.length > 200) {
    throw new ApiError("DEVICE_UNAUTHORIZED", 401);
  }
  const rows = await query<DeviceRow>(
    `SELECT id, name, status
       FROM devices
      WHERE credential_hash = $1 AND status = 'active'
      LIMIT 1`,
    [hashDeviceCredential(credential)],
  );
  const device = rows[0];
  if (!device) throw new ApiError("DEVICE_UNAUTHORIZED", 401);
  void query(
    "UPDATE devices SET last_seen_at = now() WHERE id = $1",
    [device.id],
  ).catch(() => undefined);
  return device;
}

export async function createDevice(name: string) {
  const credential = createDeviceCredential();
  const rows = await query<DeviceRow>(
    `INSERT INTO devices (name, credential_hash)
     VALUES ($1, $2)
     RETURNING id, name, status, created_at AS "createdAt", last_seen_at AS "lastSeenAt"`,
    [name, hashDeviceCredential(credential)],
  );
  return { credential, device: rows[0] };
}

export async function listDevices() {
  return query<DeviceRow>(
    `SELECT id, name, status, created_at AS "createdAt", last_seen_at AS "lastSeenAt"
       FROM devices
      ORDER BY created_at DESC`,
  );
}

export async function setDeviceStatus(id: string, status: Device["status"]) {
  const rows = await query<DeviceRow>(
    `UPDATE devices SET status = $2 WHERE id = $1
     RETURNING id, name, status, created_at AS "createdAt", last_seen_at AS "lastSeenAt"`,
    [id, status],
  );
  if (!rows[0]) throw new ApiError("DEVICE_NOT_FOUND", 404);
  return rows[0];
}

