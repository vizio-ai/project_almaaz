-- =============================================================================
-- Migration: 00015_m3_schema_fixes.sql
-- Milestone: M3 — Manual Itinerary Creation & Management
-- Description: Fix schema mismatches between the existing DB schema and the
--              app code implementation. Five changes are made:
--
--   1. itineraries        → add is_clonable column (was missing, code writes it)
--   2. itinerary_days     → rename summary → notes (code reads/writes 'notes')
--   3. itinerary_activities → create new table (code expects this, not 'activities')
--   4. itinerary_travel_info → rename from 'travel_info' (code expects this name)
--   5. Drop INSERT auto-day trigger → prevents double-day creation on save
-- =============================================================================


-- ─── 1. itineraries: add is_clonable ─────────────────────────────────────────
--
-- The domain entity, screen state, and repository all read/write is_clonable,
-- but the column was never added to the schema.

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS is_clonable BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.itineraries.is_clonable IS
  'When TRUE, other users may clone this itinerary as their own starting point.';

-- Update the trips view to expose is_clonable.
-- CREATE OR REPLACE VIEW cannot reorder/insert columns, so we drop and recreate.
DROP VIEW IF EXISTS public.trips;
CREATE VIEW public.trips WITH (security_invoker = true) AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.destination,
  i.cover_image_url,
  i.save_count,
  i.view_count,
  i.is_public,
  i.is_clonable,
  i.is_ai_generated,
  i.start_date,
  i.end_date,
  i.created_at,
  (p.name || ' ' || p.surname) AS creator_name,
  p.avatar_url                  AS creator_avatar_url,
  p.username                    AS creator_username
FROM public.itineraries i
JOIN public.profiles p ON p.id = i.user_id;

COMMENT ON VIEW public.trips IS
  'Itineraries joined with author info. Respects RLS on itineraries table.';


-- ─── 2. itinerary_days: rename summary → notes ───────────────────────────────
--
-- The schema column was called 'summary'; every repository method (addDay,
-- updateDay, getById) reads and writes the column as 'notes'. The rename is
-- wrapped in a DO block so it is idempotent.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'itinerary_days'
      AND column_name  = 'summary'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'itinerary_days'
      AND column_name  = 'notes'
  ) THEN
    ALTER TABLE public.itinerary_days RENAME COLUMN summary TO notes;
  END IF;
END $$;

COMMENT ON COLUMN public.itinerary_days.notes IS
  'User-written notes for this day (renamed from "summary").';


-- ─── 3. Create itinerary_activities ──────────────────────────────────────────
--
-- The repository queries/inserts into 'itinerary_activities' with this schema:
--   id, day_id, sort_order, name, location_text, latitude, longitude
--
-- The existing 'activities' table has a different, richer schema (activity_type,
-- description, start_time, end_time, etc.) intended for M4 (AI-assisted builder).
-- Both tables coexist; activity_attachments (M7) continues to reference activities.

CREATE TABLE IF NOT EXISTS public.itinerary_activities (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id         UUID         NOT NULL
                              REFERENCES public.itinerary_days(id) ON DELETE CASCADE,

  sort_order     SMALLINT     NOT NULL DEFAULT 0,
  name           TEXT         NOT NULL,

  -- Optional location picked via OpenStreetMap / Nominatim
  location_text  TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,

  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.itinerary_activities IS
  'Manual activities within an itinerary day (M3). '
  'Richer AI-generated activities live in the activities table (M4).';

CREATE INDEX IF NOT EXISTS idx_itinerary_activities_day_id
  ON public.itinerary_activities(day_id);

DROP TRIGGER IF EXISTS trg_itinerary_activities_updated_at
  ON public.itinerary_activities;

CREATE TRIGGER trg_itinerary_activities_updated_at
  BEFORE UPDATE ON public.itinerary_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: traverse day → itinerary to check public flag or ownership
ALTER TABLE public.itinerary_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itinerary_activities_select"    ON public.itinerary_activities;
DROP POLICY IF EXISTS "itinerary_activities_all_owner" ON public.itinerary_activities;

CREATE POLICY "itinerary_activities_select"
  ON public.itinerary_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.itinerary_days d
      JOIN   public.itineraries    i ON i.id = d.itinerary_id
      WHERE  d.id = day_id
        AND  (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

CREATE POLICY "itinerary_activities_all_owner"
  ON public.itinerary_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   public.itinerary_days d
      JOIN   public.itineraries    i ON i.id = d.itinerary_id
      WHERE  d.id = day_id
        AND  i.user_id = auth.uid()
    )
  );


-- ─── 4. Rename travel_info → itinerary_travel_info ───────────────────────────
--
-- Every repository method uses the table name 'itinerary_travel_info', but the
-- schema created it as 'travel_info'. PostgreSQL automatically migrates FK
-- constraints and triggers when a table is renamed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'travel_info'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'itinerary_travel_info'
  ) THEN
    ALTER TABLE public.travel_info RENAME TO itinerary_travel_info;
  END IF;
END $$;

-- Recreate index under the correct name
DROP INDEX IF EXISTS public.idx_travel_info_itinerary_id;
CREATE INDEX IF NOT EXISTS idx_itinerary_travel_info_itinerary_id
  ON public.itinerary_travel_info(itinerary_id);

-- Recreate RLS policies under the correct names
-- (old policy names still work after rename; we drop them to avoid confusion)
DROP POLICY IF EXISTS "travel_info_select"             ON public.itinerary_travel_info;
DROP POLICY IF EXISTS "travel_info_all_owner"          ON public.itinerary_travel_info;
DROP POLICY IF EXISTS "itinerary_travel_info_select"   ON public.itinerary_travel_info;
DROP POLICY IF EXISTS "itinerary_travel_info_all_owner" ON public.itinerary_travel_info;

CREATE POLICY "itinerary_travel_info_select"
  ON public.itinerary_travel_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

CREATE POLICY "itinerary_travel_info_all_owner"
  ON public.itinerary_travel_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND i.user_id = auth.uid()
    )
  );


-- ─── 5. Drop INSERT auto-day trigger ─────────────────────────────────────────
--
-- PROBLEM: ManualItineraryScreen.handleSave() creates the itinerary with dates
-- and then loops through each draft day calling addDay() one by one (to persist
-- per-day notes). The INSERT trigger (trg_create_itinerary_days) fires at the
-- same moment and also inserts all days → every day is created TWICE.
--
-- FIX: Drop the INSERT trigger. The screen's explicit addDay() loop is now the
-- sole source of day creation for new itineraries.
--
-- The UPDATE trigger (trg_update_itinerary_days) is intentionally kept so that
-- changing start_date / end_date on an existing itinerary regenerates days.
-- WARNING: the UPDATE trigger deletes all existing days (and their activities
-- via CASCADE) before recreating them, so date edits are destructive. This is
-- acceptable for M3 but should be revisited before date editing is exposed in
-- the edit-mode UI.

DROP TRIGGER IF EXISTS trg_create_itinerary_days ON public.itineraries;
