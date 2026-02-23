-- =============================================================================
-- Migration: 00004_notes.sql
-- Milestone: M5 — AI Note Structuring
--            M7 — Active Trip Mode & Notes
-- Description: Free-form notes taken during a trip, and AI-generated summaries.
-- =============================================================================

-- ─── Trip Notes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trip_notes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id    UUID        NOT NULL REFERENCES public.itineraries(id)  ON DELETE CASCADE,
  day_id          UUID        REFERENCES public.itinerary_days(id)         ON DELETE SET NULL,

  content         TEXT        NOT NULL,     -- User note
  ai_summary      TEXT,                     -- Result of "Summarize with AI" (M5)

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.trip_notes IS
  'M7: Free-form notes taken during a trip. ai_summary is populated by M5.';
COMMENT ON COLUMN public.trip_notes.day_id IS
  'NULL = itinerary-level note; set = note belongs to that specific day.';

CREATE INDEX IF NOT EXISTS idx_notes_itinerary_id ON public.trip_notes(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_notes_day_id        ON public.trip_notes(day_id);

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.trip_notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON public.trip_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_all_owner" ON public.trip_notes;
CREATE POLICY "notes_all_owner"
  ON public.trip_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id AND i.user_id = auth.uid()
    )
  );
