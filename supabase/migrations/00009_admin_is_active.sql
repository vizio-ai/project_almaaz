-- =============================================================================
-- Migration: 00009_admin_is_active.sql
-- Description: Add is_active flag to profiles for admin user management,
--              guard trigger to prevent self-activation, and an RPC that
--              returns aggregate admin stats in a single round-trip.
-- =============================================================================

-- ─── is_active column ────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_active IS
  'Whether the user account is active. Only admins can change this.';

-- ─── Guard trigger: only admin or service role can toggle is_active ───────────

CREATE OR REPLACE FUNCTION public.profiles_guard_is_active_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  IF OLD.is_active IS NOT DISTINCT FROM NEW.is_active THEN
    RETURN NEW;
  END IF;

  -- Service role (Dashboard, Edge Functions with service key) → allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only an admin can change is_active.'
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profiles_guard_is_active ON public.profiles;
CREATE TRIGGER trg_profiles_guard_is_active
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_is_active_change();

-- ─── RPC: get_admin_stats ─────────────────────────────────────────────────────
-- Returns total user count, weekly gain, and daily counts for the last 7 days.
-- SECURITY DEFINER so it can count all rows regardless of RLS.

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*)::bigint FROM profiles
    ),
    'weekly_gain', (
      SELECT COUNT(*)::bigint FROM profiles
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'daily_counts', (
      SELECT json_agg(
        json_build_object('date', day::text, 'count', cnt)
        ORDER BY day
      )
      FROM (
        SELECT
          date_trunc('day', d)::date AS day,
          COUNT(p.id)                AS cnt
        FROM generate_series(
          date_trunc('day', NOW() AT TIME ZONE 'UTC') - INTERVAL '6 days',
          date_trunc('day', NOW() AT TIME ZONE 'UTC'),
          '1 day'::interval
        ) d
        LEFT JOIN profiles p
          ON date_trunc('day', p.created_at AT TIME ZONE 'UTC') = date_trunc('day', d)
        GROUP BY day
      ) t
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
