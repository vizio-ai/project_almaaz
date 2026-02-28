-- =============================================================================
-- Migration: 00011_profiles_birthday_location.sql
-- Description: Add birthday and location fields to profiles table.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN public.profiles.birthday IS 'User birthday as free-text (e.g. "15 Jan 1990")';
COMMENT ON COLUMN public.profiles.location IS 'Country the user lives in (e.g. "Turkey")';
