-- =============================================================================
-- Migration: 00002_itineraries.sql
-- Milestone: M3 — Manual Itinerary Creation & Management
--            M4 — AI-Assisted Itinerary Builder
-- Description: Travel plans, days, activities, and travel logistics.
-- =============================================================================

-- ─── Itineraries ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.itineraries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Basic info
  title             TEXT        NOT NULL,
  destination       TEXT        NOT NULL,       -- Plain text (required)
  destination_lat   DOUBLE PRECISION,           -- OpenStreetMap coordinate
  destination_lng   DOUBLE PRECISION,
  cover_image_url   TEXT,                       -- Supabase Storage URL

  -- Dates
  start_date        DATE,
  end_date          DATE,

  -- Travel details
  companions        TEXT[]      DEFAULT '{}',   -- List of names
  trip_notes        TEXT,                       -- General notes

  -- Visibility & Features
  is_public         BOOLEAN     NOT NULL DEFAULT FALSE,
  is_ai_generated   BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Social counters
  save_count        INT         NOT NULL DEFAULT 0,
  view_count        INT         NOT NULL DEFAULT 0,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.itineraries IS
  'Travel plans created by users.';
COMMENT ON COLUMN public.itineraries.is_ai_generated IS
  'TRUE: created by Dora AI. FALSE: created manually.';

CREATE INDEX IF NOT EXISTS idx_itineraries_user_id   ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_is_public ON public.itineraries(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);

DROP TRIGGER IF EXISTS trg_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER trg_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Itinerary Days ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id    UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,

  day_number      SMALLINT    NOT NULL CHECK (day_number >= 1),
  date            DATE,
  summary         TEXT,                       -- AI or user-written summary
  sort_order      SMALLINT    NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.itinerary_days IS
  'Daily sections of a travel plan.';

CREATE INDEX IF NOT EXISTS idx_days_itinerary_id ON public.itinerary_days(itinerary_id);

-- ─── Activities ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activities (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id    UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_id          UUID        NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,

  -- Activity info
  name            TEXT        NOT NULL,
  activity_type   TEXT        CHECK (activity_type IN (
                                'park', 'restaurant', 'monument', 'museum',
                                'shopping', 'accommodation', 'viewpoint', 'other'
                              )),

  -- Place info
  place_name      TEXT,
  place_lat       DOUBLE PRECISION,
  place_lng       DOUBLE PRECISION,
  place_url       TEXT,                       -- OpenStreetMap or external link

  -- Description fetched from SerpAPI (AI-assisted)
  description     TEXT,

  -- Time
  start_time      TIME,
  end_time        TIME,

  -- User note
  notes           TEXT,

  -- Ordering
  sort_order      SMALLINT    NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activities IS
  'Daily activities. Can be created manually or by AI.';
COMMENT ON COLUMN public.activities.place_lat IS
  'OpenStreetMap/Nominatim coordinate.';

CREATE INDEX IF NOT EXISTS idx_activities_day_id         ON public.activities(day_id);
CREATE INDEX IF NOT EXISTS idx_activities_itinerary_id   ON public.activities(itinerary_id);

DROP TRIGGER IF EXISTS trg_activities_updated_at ON public.activities;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Activity Attachments ─────────────────────────────────────────────────────
-- Photos and documents attached to activities (M7: Active Trip Mode)

CREATE TABLE IF NOT EXISTS public.activity_attachments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     UUID        NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,

  url             TEXT        NOT NULL,       -- Supabase Storage URL  
  type            TEXT        NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'document')),
  filename        TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_activity_id ON public.activity_attachments(activity_id);

-- ─── Travel Info ──────────────────────────────────────────────────────────────
-- Travel logistics: flights, hotels, rental cars, transfers, etc.

CREATE TABLE IF NOT EXISTS public.travel_info (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id    UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,

  type            TEXT        NOT NULL CHECK (type IN ('flight', 'hotel', 'rental_car', 'transfer', 'other')),
  title           TEXT        NOT NULL,       -- e.g. "Turkish Airlines TK 1234"
  detail          TEXT,                       -- Extra info / reservation note
  provider        TEXT,                       -- e.g. "Turkish Airlines", "Hilton"
  confirmation_no TEXT,
  start_datetime  TIMESTAMPTZ,
  end_datetime    TIMESTAMPTZ,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_travel_info_itinerary_id ON public.travel_info(itinerary_id);

-- ─── Trigger: new itinerary → increment profile trip_count ───────────────────

CREATE OR REPLACE FUNCTION public.increment_trip_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET trip_count = trip_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_trip_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET trip_count = GREATEST(trip_count - 1, 0)
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_itinerary_created ON public.itineraries;
CREATE TRIGGER trg_itinerary_created
  AFTER INSERT ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.increment_trip_count();

DROP TRIGGER IF EXISTS trg_itinerary_deleted ON public.itineraries;
CREATE TRIGGER trg_itinerary_deleted
  AFTER DELETE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.decrement_trip_count();

-- ─── Trigger: auto-create itinerary days ─────────────────────────────────────
-- Creates day rows automatically when start_date and end_date are set.

CREATE OR REPLACE FUNCTION public.create_itinerary_days()
RETURNS TRIGGER AS $$
DECLARE
  v_day_count  INT;
  v_day_num    INT;
  v_date       DATE;
BEGIN
  -- Only proceed if dates are set
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    v_day_count := (NEW.end_date - NEW.start_date) + 1;

    -- Maximum 60 days
    IF v_day_count > 0 AND v_day_count <= 60 THEN
      DELETE FROM public.itinerary_days WHERE itinerary_id = NEW.id;

      FOR v_day_num IN 1..v_day_count LOOP
        v_date := NEW.start_date + (v_day_num - 1);
        INSERT INTO public.itinerary_days (itinerary_id, day_number, date, sort_order)
        VALUES (NEW.id, v_day_num, v_date, v_day_num);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_itinerary_days ON public.itineraries;
CREATE TRIGGER trg_create_itinerary_days
  AFTER INSERT ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.create_itinerary_days();

DROP TRIGGER IF EXISTS trg_update_itinerary_days ON public.itineraries;
CREATE TRIGGER trg_update_itinerary_days
  AFTER UPDATE OF start_date, end_date ON public.itineraries
  FOR EACH ROW
  WHEN (OLD.start_date IS DISTINCT FROM NEW.start_date
     OR OLD.end_date   IS DISTINCT FROM NEW.end_date)
  EXECUTE FUNCTION public.create_itinerary_days();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

-- itineraries
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itineraries_select" ON public.itineraries;
CREATE POLICY "itineraries_select"
  ON public.itineraries FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_insert" ON public.itineraries;
CREATE POLICY "itineraries_insert"
  ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_update" ON public.itineraries;
CREATE POLICY "itineraries_update"
  ON public.itineraries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_delete" ON public.itineraries;
CREATE POLICY "itineraries_delete"
  ON public.itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- itinerary_days
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "days_select" ON public.itinerary_days;
CREATE POLICY "days_select"
  ON public.itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "days_all_owner" ON public.itinerary_days;
CREATE POLICY "days_all_owner"
  ON public.itinerary_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select" ON public.activities;
CREATE POLICY "activities_select"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "activities_all_owner" ON public.activities;
CREATE POLICY "activities_all_owner"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );

-- activity_attachments
ALTER TABLE public.activity_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachments_select" ON public.activity_attachments;
CREATE POLICY "attachments_select"
  ON public.activity_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.itineraries i ON i.id = a.itinerary_id
      WHERE a.id = activity_id
        AND (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "attachments_all_owner" ON public.activity_attachments;
CREATE POLICY "attachments_all_owner"
  ON public.activity_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.itineraries i ON i.id = a.itinerary_id
      WHERE a.id = activity_id AND i.user_id = auth.uid()
    )
  );

-- travel_info
ALTER TABLE public.travel_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "travel_info_select" ON public.travel_info;
CREATE POLICY "travel_info_select"
  ON public.travel_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.is_public = TRUE OR i.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "travel_info_all_owner" ON public.travel_info;
CREATE POLICY "travel_info_all_owner"
  ON public.travel_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );
