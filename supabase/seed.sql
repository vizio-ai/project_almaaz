-- =============================================================================
-- Seed: seed.sql
-- Description: Sample data for the development environment.
--              Runs automatically on: supabase db reset
--              DO NOT run in production.
-- =============================================================================

-- ─── Warning ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF current_database() NOT LIKE '%local%' AND current_database() NOT LIKE '%dev%' THEN
    RAISE NOTICE 'WARNING: This seed file is intended for local/dev environments only!';
  END IF;
END $$;

-- ─── Test users ──────────────────────────────────────────────────────────────
-- NOTE: Supabase Auth users are inserted into auth.users.
-- For OTP testing, add them manually via Supabase Dashboard > Auth > Users.
-- Once inserted, the profile trigger fires automatically.

-- Update profiles (trigger auto-fills id and phone)
-- First create users with +15551110001 and +15551110002 in the dashboard.

/*
-- Sample profile updates (run after creating the users above):

UPDATE public.profiles SET
  name = 'Alex',
  surname = 'Jordan',
  email = 'alex@example.com',
  username = 'alexjordan',
  is_onboarded = TRUE,
  pace = 'planned_fast',
  interests = ARRAY['culture', 'food', 'nature'],
  journaling = 'storyteller',
  companionship = 'friends'
WHERE phone = '+15551110001';

UPDATE public.profiles SET
  name = 'Bethany',
  surname = 'Clarke',
  email = 'bethany@example.com',
  username = 'bethanytravels',
  is_onboarded = TRUE,
  pace = 'spontaneous',
  interests = ARRAY['shopping', 'food'],
  journaling = 'photographer',
  companionship = 'partner'
WHERE phone = '+15551110002';
*/

-- ─── Sample itinerary ────────────────────────────────────────────────────────
-- A public itinerary example to appear on the Discover page.
-- Replace user_id with the real UUID after the profile has been created.

/*
INSERT INTO public.itineraries (
  user_id, title, destination, destination_lat, destination_lng,
  start_date, end_date, is_public, is_ai_generated
) VALUES (
  '00000000-0000-0000-0000-000000000001',   -- Bethany's user_id
  'A breath-taking journey on Tuscany',
  'Tuscany, Italy',
  43.7711, 11.2486,
  '2026-04-04', '2026-04-09',
  TRUE, FALSE
);
*/

SELECT 'Seed file loaded. Uncomment the blocks above after creating the auth users.' AS info;
