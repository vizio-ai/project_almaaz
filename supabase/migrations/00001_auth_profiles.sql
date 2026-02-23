-- =============================================================================
-- Migration: 00001_auth_profiles.sql
-- Milestone: M2 — User Access & Identity Layer
-- Description: User profiles and travel persona tables.
--              Extends Supabase Auth (auth.users).
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extended profile for every Supabase Auth user.
-- id shares the same UUID as auth.users.id.

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name            TEXT,
  surname         TEXT,
  email           TEXT,
  username        TEXT        UNIQUE,
  avatar_url      TEXT,
  bio             TEXT,

  -- Synced from auth.users.phone for easy reads
  phone           TEXT,

  -- Onboarding status
  is_onboarded    BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Travel Persona (set during onboarding)
  pace            TEXT        CHECK (pace IN ('planned_fast', 'balanced', 'spontaneous')),
  interests       TEXT[]      DEFAULT '{}',   -- ['culture','food','places','nature','shopping']
  journaling      TEXT        CHECK (journaling IN ('storyteller', 'minimalist', 'photographer')),
  companionship   TEXT        CHECK (companionship IN ('solo', 'friends', 'family', 'partner')),

  -- Social counters (maintained by triggers)
  following_count INT         NOT NULL DEFAULT 0,
  followers_count INT         NOT NULL DEFAULT 0,
  trip_count      INT         NOT NULL DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS
  'Extended user profile table that augments auth.users.';

COMMENT ON COLUMN public.profiles.pace IS
  'Travel pace: planned_fast | balanced | spontaneous';
COMMENT ON COLUMN public.profiles.interests IS
  'Array of interests: culture, food, places, nature, shopping';
COMMENT ON COLUMN public.profiles.journaling IS
  'Journaling style: storyteller | minimalist | photographer';
COMMENT ON COLUMN public.profiles.companionship IS
  'Travel companion preference: solo | friends | family | partner';

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone    ON public.profiles(phone);

-- ─── Trigger: updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Trigger: new auth.users → create empty profile ──────────────────────────
-- Automatically inserts a profile row when a user registers via OTP.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
