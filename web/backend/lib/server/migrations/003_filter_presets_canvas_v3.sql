-- Run after 002_fixed_device_upload_token.sql and before deploying Canvas v3.
-- jungle-green remains accepted only for historical rows that were published
-- before it was retired. New API requests reject it.

ALTER TABLE photos
  DROP CONSTRAINT IF EXISTS photos_filter_preset_check;

ALTER TABLE photos
  ADD CONSTRAINT photos_filter_preset_check CHECK (
    filter_preset IS NULL OR
    filter_preset IN (
      'none', 'tiger-film', 'baby-tiger', 'night-hunter', 'mono-mochi',
      'neon-party', 'sunny-milk', 'candy-pop', 'lavender-dream',
      'jungle-green'
    )
  );
