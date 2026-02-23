-- avatars: UPDATE policy required for upsert (overwrite)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
    CREATE POLICY "avatars_owner_update"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::TEXT = (storage.foldername(name))[1]
      );
  END IF;
END $$;
