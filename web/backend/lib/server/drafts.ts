import "server-only";

import { randomUUID } from "node:crypto";

import { query } from "@/lib/server/db";
import { getApiUrl } from "@/lib/server/env";
import { originalObjectKey } from "@/lib/server/r2";
import { ApiError } from "@/lib/server/validation";
import type {
  FilterPreset,
  InitiateDraftInput,
  Photo,
  PhotoStatus,
  PublishDraftInput,
} from "@/lib/types";

export type DraftRow = {
  capturedAt: string;
  claimCode: string | null;
  claimExpiresAt: string | null;
  claimToken: string | null;
  claimTokenExpiresAt: string | null;
  deviceId: string;
  height: number | null;
  id: string;
  originalKey: string | null;
  originalSize: number | null;
  processedKey: string | null;
  processedSize: number | null;
  status: PhotoStatus;
  width: number | null;
};

const draftColumns = `
  id,
  device_id AS "deviceId",
  status,
  original_key AS "originalKey",
  processed_key AS "processedKey",
  claim_code AS "claimCode",
  claim_expires_at AS "claimExpiresAt",
  claim_token AS "claimToken",
  claim_token_expires_at AS "claimTokenExpiresAt",
  captured_at AS "capturedAt",
  width,
  height,
  original_size AS "originalSize",
  processed_size AS "processedSize"`;

export async function createOrGetUploadingDraft(deviceId: string, input: InitiateDraftInput) {
  const id = randomUUID();
  const key = originalObjectKey(id);
  const rows = await query<DraftRow>(
    `INSERT INTO photos (
       id, device_id, client_request_id, original_key, status, captured_at,
       mime_type, width, height, original_size
     ) VALUES ($1, $2, $3, $4, 'uploading', $5, 'image/jpeg', $6, $7, $8)
     ON CONFLICT (device_id, client_request_id)
     DO UPDATE SET client_request_id = EXCLUDED.client_request_id
     RETURNING ${draftColumns}`,
    [
      id,
      deviceId,
      input.clientRequestId,
      key,
      input.capturedAt,
      input.width,
      input.height,
      input.originalSize,
    ],
  );
  const draft = rows[0];
  if (!draft) throw new ApiError("DRAFT_CREATE_FAILED", 500);
  if (draft.status !== "uploading") throw new ApiError("DRAFT_ALREADY_COMPLETED", 409);
  return draft;
}

export async function getDeviceDraft(id: string, deviceId: string) {
  const rows = await query<DraftRow>(
    `SELECT ${draftColumns} FROM photos WHERE id = $1 AND device_id = $2 LIMIT 1`,
    [id, deviceId],
  );
  const draft = rows[0];
  if (!draft) throw new ApiError("DRAFT_NOT_FOUND", 404);
  return draft;
}

export async function markDraftReady(
  id: string,
  deviceId: string,
  claimCode: string,
  claimExpiresAt: string,
) {
  const rows = await query<DraftRow>(
    `UPDATE photos
        SET status = 'ready', claim_code = $3, claim_expires_at = $4, completed_at = now()
      WHERE id = $1 AND device_id = $2 AND status = 'uploading'
      RETURNING ${draftColumns}`,
    [id, deviceId, claimCode, claimExpiresAt],
  );
  return rows[0] ?? null;
}

export async function claimDraftByCode(code: string, token: string, tokenExpiresAt: string) {
  const rows = await query<DraftRow>(
    `WITH candidate AS (
       SELECT id FROM photos
        WHERE status = 'ready' AND claim_code = $1 AND claim_expires_at > now()
        LIMIT 1
        FOR UPDATE SKIP LOCKED
     )
     UPDATE photos AS photo
        SET status = 'claimed', claim_code = NULL, claim_token = $2,
            claim_token_expires_at = $3, claimed_at = now()
       FROM candidate
      WHERE photo.id = candidate.id AND photo.status = 'ready'
      RETURNING
        photo.id,
        photo.device_id AS "deviceId",
        photo.status,
        photo.original_key AS "originalKey",
        photo.processed_key AS "processedKey",
        photo.claim_code AS "claimCode",
        photo.claim_expires_at AS "claimExpiresAt",
        photo.claim_token AS "claimToken",
        photo.claim_token_expires_at AS "claimTokenExpiresAt",
        photo.captured_at AS "capturedAt",
        photo.width,
        photo.height,
        photo.original_size AS "originalSize",
        photo.processed_size AS "processedSize"`,
    [code, token, tokenExpiresAt],
  );
  const draft = rows[0];
  if (!draft) throw new ApiError("CLAIM_CODE_NOT_FOUND", 404);
  return draft;
}

export async function getClaimedDraft(id: string, token: string) {
  const rows = await query<DraftRow>(
    `SELECT ${draftColumns}
       FROM photos
      WHERE id = $1 AND claim_token = $2 AND status = 'claimed'
        AND claim_token_expires_at > now()
      LIMIT 1`,
    [id, token],
  );
  const draft = rows[0];
  if (!draft) throw new ApiError("INVALID_CLAIM_TOKEN", 401);
  return draft;
}

export async function assignProcessedKey(id: string, token: string, key: string, size: number) {
  const rows = await query<DraftRow>(
    `UPDATE photos
        SET processed_key = $3, processed_size = $4
      WHERE id = $1 AND claim_token = $2 AND status = 'claimed'
        AND claim_token_expires_at > now()
      RETURNING ${draftColumns}`,
    [id, token, key, size],
  );
  const draft = rows[0];
  if (!draft) throw new ApiError("INVALID_CLAIM_TOKEN", 401);
  return draft;
}

type PublishedRow = {
  createdAt: string;
  filterPreset: FilterPreset;
  id: string;
  title: string;
};

export async function publishDraftRecord(id: string, token: string, input: PublishDraftInput) {
  const rows = await query<PublishedRow>(
    `UPDATE photos
        SET status = 'active', title = $3, width = $4, height = $5,
            processed_size = $6, frame_enabled = $7, timestamp_enabled = $8,
            text_mode = $9, custom_text = $10, resolved_text = $11,
            filter_preset = $12, processing_version = $13, published_at = now(),
            claim_token = NULL, claim_token_expires_at = NULL
      WHERE id = $1 AND claim_token = $2 AND status = 'claimed'
        AND claim_token_expires_at > now() AND processed_key IS NOT NULL
      RETURNING id, title, published_at AS "createdAt", filter_preset AS "filterPreset"`,
    [
      id,
      token,
      input.title,
      input.width,
      input.height,
      input.processedSize,
      input.frameEnabled,
      input.timestampEnabled,
      input.textMode,
      input.customText,
      input.resolvedText,
      input.filterPreset,
      input.processingVersion,
    ],
  );
  const row = rows[0];
  if (!row) throw new ApiError("PUBLISH_CONFLICT", 409);
  return toPhoto(row);
}

export async function clearOriginalKey(id: string) {
  await query(
    `UPDATE photos SET original_key = NULL, original_deleted_at = now()
      WHERE id = $1 AND status = 'active'`,
    [id],
  );
}

function toPhoto(row: PublishedRow): Photo {
  return {
    id: row.id,
    title: row.title,
    imageUrl: getApiUrl(`/api/photos/${row.id}/image`),
    createdAt: row.createdAt,
    filterPreset: row.filterPreset,
  };
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
