-- =============================================================================
-- Migration: 00016_activity_fields.sql
-- Description: Add missing fields to itinerary_activities and itinerary_days
--              so that the edit-mode UI matches the create-mode wizard.
--
--   1. itinerary_activities → add activity_type (UI enum), start_time (TEXT)
--   2. itinerary_days       → add accommodation (TEXT hotel name per day)
-- =============================================================================

-- ─── 1. itinerary_activities: activity_type + start_time ─────────────────────

ALTER TABLE public.itinerary_activities
  ADD COLUMN IF NOT EXISTS activity_type TEXT
    CHECK (activity_type IN ('park', 'museum', 'food', 'shopping', 'historic', 'beach'));

COMMENT ON COLUMN public.itinerary_activities.activity_type IS
  'UI-level activity category chosen by the user (M3 manual builder).';

-- start_time stored as plain text (e.g. "9:00 AM") matching the UI picker output.
ALTER TABLE public.itinerary_activities
  ADD COLUMN IF NOT EXISTS start_time TEXT;

COMMENT ON COLUMN public.itinerary_activities.start_time IS
  'User-selected start time as formatted string, e.g. "9:00 AM".';

-- ─── 2. itinerary_days: accommodation ────────────────────────────────────────

ALTER TABLE public.itinerary_days
  ADD COLUMN IF NOT EXISTS accommodation TEXT;

COMMENT ON COLUMN public.itinerary_days.accommodation IS
  'Hotel / accommodation name for this day, chosen via AccommodationCard.';
