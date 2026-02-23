-- =============================================================================
-- Migration: 00006_views.sql
-- Description: Prebuilt views for frequently used queries.
--              The API layer queries these views directly.
-- =============================================================================

-- ─── itineraries_with_author ──────────────────────────────────────────────────
-- Returns all data needed for discover feed and itinerary cards in one query.

CREATE OR REPLACE VIEW public.itineraries_with_author AS
SELECT
  i.id,
  i.title,
  i.destination,
  i.destination_lat,
  i.destination_lng,
  i.cover_image_url,
  i.start_date,
  i.end_date,
  i.is_public,
  i.is_ai_generated,
  i.save_count,
  i.view_count,
  i.created_at,
  -- Author info
  p.id            AS author_id,
  p.name          AS author_name,
  p.surname       AS author_surname,
  p.avatar_url    AS author_avatar_url,
  p.username      AS author_username,
  -- Day count
  (i.end_date - i.start_date + 1) AS day_count,
  -- Activity count
  (SELECT COUNT(*) FROM public.activities a WHERE a.itinerary_id = i.id) AS activity_count
FROM public.itineraries i
JOIN public.profiles p ON p.id = i.user_id
WHERE i.is_public = TRUE;

COMMENT ON VIEW public.itineraries_with_author IS
  'Used by the discover feed. Returns only public itineraries.';

-- ─── popular_itineraries ──────────────────────────────────────────────────────
-- Discover > Popular Trips: most saved itineraries from the last 30 days

CREATE OR REPLACE VIEW public.popular_itineraries AS
SELECT *
FROM public.itineraries_with_author
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY save_count DESC, created_at DESC;

COMMENT ON VIEW public.popular_itineraries IS
  'Most popular public itineraries from the last 30 days.';

-- ─── user_feed ────────────────────────────────────────────────────────────────
-- Itineraries from users the current user follows.
-- Filter by viewer_id = auth.uid() on the client side.

CREATE OR REPLACE VIEW public.following_feed AS
SELECT
  iwa.*,
  f.follower_id AS viewer_id
FROM public.itineraries_with_author iwa
JOIN public.follows f ON f.following_id = iwa.author_id
ORDER BY iwa.created_at DESC;

COMMENT ON VIEW public.following_feed IS
  'Itinerary feed of users the viewer follows. Filter with viewer_id = auth.uid().';

-- ─── profile_stats ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.profile_stats AS
SELECT
  p.*,
  -- Number of public trips
  (SELECT COUNT(*) FROM public.itineraries i
   WHERE i.user_id = p.id AND i.is_public = TRUE) AS public_trip_count,
  -- Number of distinct destinations visited
  (SELECT COUNT(DISTINCT destination) FROM public.itineraries i
   WHERE i.user_id = p.id) AS destination_count
FROM public.profiles p;

COMMENT ON VIEW public.profile_stats IS
  'User statistics used by the profile screen.';
