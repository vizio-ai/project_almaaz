-- =============================================================================
-- Migration: 00021_rls_deactivated_users.sql
-- Description: Enforce is_active checks at the database level so deactivated
--              users cannot read their own private data or mutate any data,
--              even if they bypass the frontend guard.
--
-- Changes:
--   1. Helper function: public.is_active_user()
--   2. Updated RLS policies on all data tables
--   3. Updated storage policies
--   4. Updated clone_itinerary to reject deactivated callers
--   5. Enable Supabase Realtime on profiles table
-- =============================================================================


-- ─── 1. Helper function ─────────────────────────────────────────────────────
-- Returns TRUE when the current JWT user has is_active = TRUE.
-- SECURITY DEFINER so it can always read profiles regardless of RLS context.

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

COMMENT ON FUNCTION public.is_active_user() IS
  'Returns TRUE if the authenticated user''s account is active. Used in RLS policies.';


-- ─── 2. RLS policy updates ──────────────────────────────────────────────────

-- ── profiles ────────────────────────────────────────────────────────────────
-- SELECT stays as (true) — everyone can see profiles (names on public trips, etc.)
-- UPDATE: deactivated users cannot edit their profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING  (auth.uid() = id AND public.is_active_user())
  WITH CHECK (auth.uid() = id AND public.is_active_user());

-- INSERT stays unchanged — new users insert their profile during registration
-- and they start as active by default.

-- ── itineraries ─────────────────────────────────────────────────────────────
-- SELECT: public itineraries visible to everyone; owner access requires active
DROP POLICY IF EXISTS "itineraries_select" ON public.itineraries;
CREATE POLICY "itineraries_select"
  ON public.itineraries FOR SELECT
  USING (is_public = TRUE OR (auth.uid() = user_id AND public.is_active_user()));

DROP POLICY IF EXISTS "itineraries_insert" ON public.itineraries;
CREATE POLICY "itineraries_insert"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "itineraries_update" ON public.itineraries;
CREATE POLICY "itineraries_update"
  ON public.itineraries FOR UPDATE
  USING  (auth.uid() = user_id AND public.is_active_user())
  WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "itineraries_delete" ON public.itineraries;
CREATE POLICY "itineraries_delete"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id AND public.is_active_user());

-- ── itinerary_days ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "days_select" ON public.itinerary_days;
CREATE POLICY "days_select"
  ON public.itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR (i.user_id = auth.uid() AND public.is_active_user()))
    )
  );

DROP POLICY IF EXISTS "days_all_owner" ON public.itinerary_days;
CREATE POLICY "days_all_owner"
  ON public.itinerary_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND i.user_id = auth.uid()
        AND public.is_active_user()
    )
  );

-- ── activities ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activities_select" ON public.activities;
CREATE POLICY "activities_select"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR (i.user_id = auth.uid() AND public.is_active_user()))
    )
  );

DROP POLICY IF EXISTS "activities_all_owner" ON public.activities;
CREATE POLICY "activities_all_owner"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND i.user_id = auth.uid()
        AND public.is_active_user()
    )
  );

-- ── activity_attachments ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "attachments_select" ON public.activity_attachments;
CREATE POLICY "attachments_select"
  ON public.activity_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.itineraries i ON i.id = a.itinerary_id
      WHERE a.id = activity_id
        AND (i.is_public = TRUE OR (i.user_id = auth.uid() AND public.is_active_user()))
    )
  );

DROP POLICY IF EXISTS "attachments_all_owner" ON public.activity_attachments;
CREATE POLICY "attachments_all_owner"
  ON public.activity_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.itineraries i ON i.id = a.itinerary_id
      WHERE a.id = activity_id
        AND i.user_id = auth.uid()
        AND public.is_active_user()
    )
  );

-- ── itinerary_activities (M3 manual activities) ─────────────────────────────
DROP POLICY IF EXISTS "itinerary_activities_select" ON public.itinerary_activities;
CREATE POLICY "itinerary_activities_select"
  ON public.itinerary_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.itinerary_days d
      JOIN   public.itineraries    i ON i.id = d.itinerary_id
      WHERE  d.id = day_id
        AND  (i.is_public = TRUE OR (i.user_id = auth.uid() AND public.is_active_user()))
    )
  );

DROP POLICY IF EXISTS "itinerary_activities_all_owner" ON public.itinerary_activities;
CREATE POLICY "itinerary_activities_all_owner"
  ON public.itinerary_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   public.itinerary_days d
      JOIN   public.itineraries    i ON i.id = d.itinerary_id
      WHERE  d.id = day_id
        AND  i.user_id = auth.uid()
        AND  public.is_active_user()
    )
  );

-- ── itinerary_travel_info ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "itinerary_travel_info_select" ON public.itinerary_travel_info;
CREATE POLICY "itinerary_travel_info_select"
  ON public.itinerary_travel_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR (i.user_id = auth.uid() AND public.is_active_user()))
    )
  );

DROP POLICY IF EXISTS "itinerary_travel_info_all_owner" ON public.itinerary_travel_info;
CREATE POLICY "itinerary_travel_info_all_owner"
  ON public.itinerary_travel_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND i.user_id = auth.uid()
        AND public.is_active_user()
    )
  );

-- ── bookmarks ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id AND public.is_active_user());

-- ── follows ─────────────────────────────────────────────────────────────────
-- SELECT stays as (true) — follow relationships are publicly visible
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND public.is_active_user());

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id AND public.is_active_user());

-- ── trip_notes ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notes_all_owner" ON public.trip_notes;
CREATE POLICY "notes_all_owner"
  ON public.trip_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND i.user_id = auth.uid()
        AND public.is_active_user()
    )
  );


-- ─── 3. Storage policy updates ──────────────────────────────────────────────
-- Public read policies (avatars, covers) stay unchanged — content stays visible.
-- Write/update/delete policies add is_active check.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    RAISE NOTICE 'Skipping storage policy updates: storage.objects not found.';
    RETURN;
  END IF;

  -- avatars: write
  DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
  CREATE POLICY "avatars_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- avatars: update
  DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
  CREATE POLICY "avatars_owner_update"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    )
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- avatars: delete
  DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
  CREATE POLICY "avatars_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- covers: write
  DROP POLICY IF EXISTS "covers_owner_write" ON storage.objects;
  CREATE POLICY "covers_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'covers'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- covers: delete
  DROP POLICY IF EXISTS "covers_owner_delete" ON storage.objects;
  CREATE POLICY "covers_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'covers'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- attachments: read (owner only, must be active)
  DROP POLICY IF EXISTS "attachments_owner_read" ON storage.objects;
  CREATE POLICY "attachments_owner_read"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- attachments: write
  DROP POLICY IF EXISTS "attachments_owner_write" ON storage.objects;
  CREATE POLICY "attachments_owner_write"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

  -- attachments: delete
  DROP POLICY IF EXISTS "attachments_owner_delete" ON storage.objects;
  CREATE POLICY "attachments_owner_delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'attachments'
      AND auth.uid()::TEXT = (storage.foldername(name))[1]
      AND public.is_active_user()
    );

END;
$$;


-- ─── 4. Update clone_itinerary to reject deactivated callers ────────────────

CREATE OR REPLACE FUNCTION public.clone_itinerary(
  p_source_id UUID,
  p_user_id   UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_id       UUID;
  v_old_day_id   UUID;
  v_new_day_id   UUID;
BEGIN
  -- Reject deactivated users
  IF NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Account is deactivated.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify source itinerary is public
  IF NOT EXISTS (
    SELECT 1 FROM public.itineraries
    WHERE id = p_source_id AND is_public = TRUE
  ) THEN
    RAISE EXCEPTION 'Itinerary not found or not public';
  END IF;

  -- Copy the itinerary row
  INSERT INTO public.itineraries (
    user_id, title, destination, destination_lat, destination_lng,
    cover_image_url, start_date, end_date, companions, trip_notes,
    is_public, is_ai_generated
  )
  SELECT
    p_user_id,
    title || ' (copy)',
    destination, destination_lat, destination_lng,
    cover_image_url, start_date, end_date,
    '{}',
    NULL,
    FALSE,
    is_ai_generated
  FROM public.itineraries
  WHERE id = p_source_id
  RETURNING id INTO v_new_id;

  -- Copy days
  FOR v_old_day_id IN
    SELECT id FROM public.itinerary_days
    WHERE itinerary_id = p_source_id
    ORDER BY sort_order
  LOOP
    INSERT INTO public.itinerary_days (itinerary_id, day_number, date, notes, sort_order)
    SELECT v_new_id, day_number, date, NULL, sort_order
    FROM public.itinerary_days
    WHERE id = v_old_day_id
    RETURNING id INTO v_new_day_id;

    INSERT INTO public.activities (
      itinerary_id, day_id, name, activity_type,
      place_name, place_lat, place_lng, place_url,
      description, start_time, end_time, sort_order
    )
    SELECT
      v_new_id, v_new_day_id, name, activity_type,
      place_name, place_lat, place_lng, place_url,
      description, start_time, end_time, sort_order
    FROM public.activities
    WHERE day_id = v_old_day_id
    ORDER BY sort_order;
  END LOOP;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5. Enable Supabase Realtime on profiles ────────────────────────────────
-- Required for frontend to receive live updates when is_active changes.
-- REPLICA IDENTITY FULL ensures all columns are included in the change payload.

ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication; ignore.
    NULL;
END $$;
