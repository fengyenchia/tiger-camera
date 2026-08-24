-- Run this before deploying the Backend version that uses DEVICE_UPLOAD_TOKEN.
-- Existing device rows and historical photo.device_id values are intentionally
-- retained, but the application no longer reads or writes them.

ALTER TABLE photos
  ALTER COLUMN device_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'photos_client_request_id_key'
       AND conrelid = 'photos'::regclass
  ) THEN
    ALTER TABLE photos
      ADD CONSTRAINT photos_client_request_id_key UNIQUE (client_request_id);
  END IF;
END
$$;
