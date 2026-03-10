-- =============================================================================
-- Migration: 00024_m4_activity_description.sql
-- Milestone: M4 — AI-Assisted Itinerary Builder
-- Description: Add description column to itinerary_activities so AI-generated
--              place descriptions are persisted (not just discarded).
-- =============================================================================

ALTER TABLE public.itinerary_activities
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.itinerary_activities.description IS
  'Brief description of the place/activity, populated by AI via SerpAPI or GPT.';
