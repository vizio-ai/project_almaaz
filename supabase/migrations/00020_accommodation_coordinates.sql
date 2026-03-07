-- =============================================================================
-- Migration: 00020_accommodation_coordinates.sql
-- Description: Add latitude/longitude columns to itinerary_days so that each
--              day's accommodation can be pinned on the map.
--
--   itinerary_days → add accommodation_latitude  (DOUBLE PRECISION)
--                   → add accommodation_longitude (DOUBLE PRECISION)
--
-- These columns mirror the existing latitude/longitude pattern on
-- itinerary_activities, enabling map markers for accommodations as well.
-- =============================================================================

-- ─── accommodation_latitude ─────────────────────────────────────────────────

ALTER TABLE public.itinerary_days
  ADD COLUMN IF NOT EXISTS accommodation_latitude DOUBLE PRECISION;

COMMENT ON COLUMN public.itinerary_days.accommodation_latitude IS
  'Latitude of the accommodation location for this day (WGS 84).';

-- ─── accommodation_longitude ────────────────────────────────────────────────

ALTER TABLE public.itinerary_days
  ADD COLUMN IF NOT EXISTS accommodation_longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.itinerary_days.accommodation_longitude IS
  'Longitude of the accommodation location for this day (WGS 84).';

-- ─── Partial index for map queries (only rows with coordinates) ─────────────

CREATE INDEX IF NOT EXISTS idx_itinerary_days_accommodation_coords
  ON public.itinerary_days (accommodation_latitude, accommodation_longitude)
  WHERE accommodation_latitude IS NOT NULL
    AND accommodation_longitude IS NOT NULL;
