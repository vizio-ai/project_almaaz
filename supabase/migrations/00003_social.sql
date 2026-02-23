-- =============================================================================
-- Migration: 00003_social.sql
-- Milestone: M6 — Social Sharing & Discovery
-- Description: Bookmarks, follows, and itinerary cloning.
-- =============================================================================

-- ─── Bookmarks ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id         UUID        NOT NULL REFERENCES public.profiles(id)    ON DELETE CASCADE,
  itinerary_id    UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, itinerary_id)
);

COMMENT ON TABLE public.bookmarks IS
  'Itineraries saved (bookmarked) by a user.';

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id       ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_itinerary_id  ON public.bookmarks(itinerary_id);

-- Increment itinerary.save_count when a bookmark is added
CREATE OR REPLACE FUNCTION public.increment_save_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.itineraries
  SET save_count = save_count + 1
  WHERE id = NEW.itinerary_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_save_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.itineraries
  SET save_count = GREATEST(save_count - 1, 0)
  WHERE id = OLD.itinerary_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookmark_added ON public.bookmarks;
CREATE TRIGGER trg_bookmark_added
  AFTER INSERT ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.increment_save_count();

DROP TRIGGER IF EXISTS trg_bookmark_removed ON public.bookmarks;
CREATE TRIGGER trg_bookmark_removed
  AFTER DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.decrement_save_count();

-- ─── Follows ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (follower_id, following_id),
  -- A user cannot follow themselves
  CHECK (follower_id <> following_id)
);

COMMENT ON TABLE public.follows IS
  'Follow relationship between users.';

CREATE INDEX IF NOT EXISTS idx_follows_follower   ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON public.follows(following_id);

-- Trigger: keep following/followers counters in sync
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_follow_counts ON public.follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

-- bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON public.follows;
CREATE POLICY "follows_select"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ─── Utility Function: Itinerary cloning ──────────────────────────────────────
-- Copies another user's public itinerary and saves it as the caller's own plan.

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
    '{}', -- companions reset
    NULL, -- trip_notes reset
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
    INSERT INTO public.itinerary_days (itinerary_id, day_number, date, summary, sort_order)
    SELECT v_new_id, day_number, date, NULL, sort_order
    FROM public.itinerary_days
    WHERE id = v_old_day_id
    RETURNING id INTO v_new_day_id;

    -- Copy activities (notes and attachments are reset)
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

COMMENT ON FUNCTION public.clone_itinerary IS
  'Clones a public itinerary. Used by M6: Trip Cloning feature.';
