-- =============================================================================
-- Migration: 00010_admin_stats_date_range.sql
-- Description: Update get_admin_stats() to accept a dynamic date range
--              instead of the previously hardcoded 7-day window.
-- =============================================================================

-- Drop the old parameterless version first so we can replace it cleanly.
DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '6 days',
  p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
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
      WHERE created_at >= p_start_date
        AND created_at <= p_end_date
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
          date_trunc('day', p_start_date AT TIME ZONE 'UTC'),
          date_trunc('day', p_end_date   AT TIME ZONE 'UTC'),
          '1 day'::interval
        ) d
        LEFT JOIN profiles p
          ON date_trunc('day', p.created_at AT TIME ZONE 'UTC') = date_trunc('day', d)
           AND p.created_at >= p_start_date
           AND p.created_at <= p_end_date
        GROUP BY day
      ) t
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
