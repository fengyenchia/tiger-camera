import "server-only";

import { query } from "@/lib/server/db";
import { getApiUrl } from "@/lib/server/env";
import { ApiError } from "@/lib/server/validation";
import type { FilterPreset, Photo } from "@/lib/types";

type PublicPhotoRow = {
  createdAt: string;
  filterPreset: FilterPreset;
  id: string;
  processedKey?: string;
  title: string;
};

export async function listPublicPhotos() {
  const rows = await query<PublicPhotoRow>(
    `SELECT id, title, published_at AS "createdAt", filter_preset AS "filterPreset"
       FROM photos WHERE status = 'active'
      ORDER BY published_at DESC LIMIT 200`,
  );
  return rows.map(toPhoto);
}

export async function getPublicPhotoObject(id: string) {
  const rows = await query<PublicPhotoRow>(
    `SELECT id, title, published_at AS "createdAt", filter_preset AS "filterPreset",
            processed_key AS "processedKey"
       FROM photos WHERE id = $1 AND status = 'active' LIMIT 1`,
    [id],
  );
  const photo = rows[0];
  if (!photo?.processedKey) throw new ApiError("PHOTO_NOT_FOUND", 404);
  return photo;
}

type DeletingPhoto = { id: string; originalKey: string | null; processedKey: string };

export async function markPhotoDeleting(id: string) {
  const rows = await query<DeletingPhoto>(
    `UPDATE photos SET status = 'deleting'
      WHERE id = $1 AND status IN ('active', 'deleting')
      RETURNING id, original_key AS "originalKey", processed_key AS "processedKey"`,
    [id],
  );
  const photo = rows[0];
  if (!photo) throw new ApiError("PHOTO_NOT_FOUND", 404);
  return photo;
}

export async function deletePhotoRecord(id: string) {
  await query("DELETE FROM photos WHERE id = $1 AND status = 'deleting'", [id]);
}

export type CleanupPhoto = {
  id: string;
  originalKey: string | null;
  processedKey: string | null;
  status: "uploading" | "ready" | "claimed" | "active" | "deleting";
};

export async function listCleanupCandidates(limit = 50) {
  return query<CleanupPhoto>(
    `SELECT id, status, original_key AS "originalKey", processed_key AS "processedKey"
       FROM photos
      WHERE (status = 'uploading' AND created_at < now() - interval '15 minutes')
         OR (status = 'ready' AND claim_expires_at < now())
         OR (status = 'claimed' AND claim_token_expires_at < now())
         OR (status = 'active' AND original_key IS NOT NULL)
         OR status = 'deleting'
      ORDER BY created_at ASC
      LIMIT $1`,
    [limit],
  );
}

export async function deleteExpiredDraftRecord(id: string) {
  await query(
    "DELETE FROM photos WHERE id = $1 AND status IN ('uploading', 'ready', 'claimed')",
    [id],
  );
}

export async function clearPublishedOriginal(id: string) {
  await query(
    `UPDATE photos SET original_key = NULL, original_deleted_at = now()
      WHERE id = $1 AND status = 'active'`,
    [id],
  );
}

function toPhoto(row: PublicPhotoRow): Photo {
  return {
    id: row.id,
    title: row.title,
    imageUrl: getApiUrl(`/api/photos/${row.id}/image`),
    createdAt: row.createdAt,
    filterPreset: row.filterPreset,
  };
}

