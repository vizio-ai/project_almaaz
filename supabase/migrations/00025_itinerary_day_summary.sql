-- =============================================================================
-- Migration: 00025_itinerary_day_summary.sql
-- Milestone: M4 — AI-Assisted Itinerary Builder
-- Description: Add AI-generated summary column to itinerary_days.
--              Separate from user-written 'notes': summary is auto-generated
--              by AI based on the day's activities, accommodation, and notes.
-- =============================================================================

ALTER TABLE public.itinerary_days
  ADD COLUMN IF NOT EXISTS summary TEXT;

COMMENT ON COLUMN public.itinerary_days.summary IS
  'AI-generated 1-2 sentence summary of the day based on activities and notes. Auto-updated asynchronously.';
