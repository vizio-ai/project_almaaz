-- =============================================================================
-- Migration: 00005_storage.sql
-- Description: Supabase Storage buckets and access policies.
--              Covers photo uploads, cover images, and profile avatars.
--              Skipped gracefully if storage.buckets is missing (requires Supabase Cloud or supabase start).
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    RAISE NOTICE 'Skipping 00005_storage: storage.buckets not found. Use Supabase Cloud or supabase start for Storage.';
    RETURN;
  END IF;

  -- ─── Buckets ──────────────────────────────────────────────────────────────────

  -- Profile photos
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,                -- Public: readable by everyone
  5242880,             -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO NOTHING;

  -- Trip cover images
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  TRUE,                -- Public: visible when the itinerary is public
  10485760,            -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO NOTHING;

  -- Activity attachments (photos, documents) — M7
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  FALSE,               -- Private: owner access only
  20971520,            -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
  ON CONFLICT (id) DO NOTHING;

  -- ─── Storage RLS Policies ─────────────────────────────────────────────────────

  -- avatars: public read, write only to own folder
    DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  CREATE POLICY "avatars_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
  CREATE POLICY "avatars_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
  CREATE POLICY "avatars_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  -- covers: public read, owner write
  -- Folder structure: covers/{user_id}/{itinerary_id}.jpg
  DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;
  CREATE POLICY "covers_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');

  DROP POLICY IF EXISTS "covers_owner_write" ON storage.objects;
  CREATE POLICY "covers_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'covers'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "covers_owner_delete" ON storage.objects;
  CREATE POLICY "covers_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'covers'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  -- attachments: owner access only
  -- Folder structure: attachments/{user_id}/{itinerary_id}/{activity_id}/{file}
  DROP POLICY IF EXISTS "attachments_owner_read" ON storage.objects;
  CREATE POLICY "attachments_owner_read"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "attachments_owner_write" ON storage.objects;
  CREATE POLICY "attachments_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

  DROP POLICY IF EXISTS "attachments_owner_delete" ON storage.objects;
  CREATE POLICY "attachments_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
    );

END;
$$;
