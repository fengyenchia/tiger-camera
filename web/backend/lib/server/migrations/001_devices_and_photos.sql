CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credential_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id),
  client_request_id uuid NOT NULL,
  original_key text UNIQUE,
  processed_key text UNIQUE,
  status text NOT NULL
    CHECK (status IN ('uploading', 'ready', 'claimed', 'active', 'deleting')),
  claim_code text UNIQUE
    CHECK (claim_code IS NULL OR claim_code ~ '^[A-F0-9]{6}$'),
  claim_expires_at timestamptz,
  claim_token uuid UNIQUE,
  claim_token_expires_at timestamptz,
  claimed_at timestamptz,
  published_at timestamptz,
  original_deleted_at timestamptz,
  title text,
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  frame_enabled boolean,
  timestamp_enabled boolean,
  text_mode text CHECK (text_mode IS NULL OR text_mode IN ('custom', 'default', 'none')),
  custom_text text,
  resolved_text text,
  filter_preset text CHECK (
    filter_preset IS NULL OR
    filter_preset IN ('none', 'tiger-film', 'jungle-green', 'baby-tiger', 'night-hunter')
  ),
  processing_version text,
  mime_type text NOT NULL DEFAULT 'image/jpeg' CHECK (mime_type = 'image/jpeg'),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  original_size integer CHECK (original_size IS NULL OR original_size > 0),
  processed_size integer CHECK (processed_size IS NULL OR processed_size > 0),
  UNIQUE (device_id, client_request_id),
  CONSTRAINT photos_object_keys_check CHECK (
    (status IN ('uploading', 'ready', 'claimed') AND original_key IS NOT NULL) OR
    (status IN ('active', 'deleting') AND processed_key IS NOT NULL)
  ),
  CONSTRAINT photos_claim_fields_check CHECK (
    (status = 'uploading' AND claim_code IS NULL AND claim_token IS NULL) OR
    (status = 'ready' AND claim_code IS NOT NULL AND claim_token IS NULL) OR
    (status = 'claimed' AND claim_code IS NULL AND claim_token IS NOT NULL) OR
    (status IN ('active', 'deleting') AND claim_code IS NULL AND claim_token IS NULL)
  )
);

CREATE INDEX photos_public_idx
  ON photos (published_at DESC)
  WHERE status = 'active';

CREATE INDEX photos_cleanup_idx
  ON photos (status, claim_expires_at, claim_token_expires_at, created_at);

CREATE INDEX photos_original_cleanup_idx
  ON photos (published_at)
  WHERE status = 'active' AND original_key IS NOT NULL;

