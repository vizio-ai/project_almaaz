-- =============================================================================
-- Migration: 00018_delete_user.sql
-- Description:
--   1. Fix update_follow_counts trigger: guard against updating a profile that
--      is being cascade-deleted in the same transaction (causes tuple-version
--      conflicts).
--   2. Fix decrement_trip_count trigger: same guard.
--   3. Add delete_user(target_user_id) RPC callable by admin users.
--      Deletes from auth.users → all public data cascades automatically.
-- =============================================================================


-- ─── 1. Fix update_follow_counts ─────────────────────────────────────────────
--
-- PROBLEM: When user A is deleted, public.profiles(A) is cascade-deleted from
-- auth.users. The cascade also deletes all follows rows where follower_id = A
-- or following_id = A. For each deleted follows row the trigger fires and tries
-- to UPDATE public.profiles WHERE id = A – but that row is mid-deletion, which
-- can raise "could not update row: tuple concurrently updated / being deleted".
--
-- FIX: Skip the UPDATE when the target profile no longer exists (0 rows
-- affected is not an error; the profile will be gone anyway).

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET following_count = following_count + 1
      WHERE id = NEW.follower_id;
    UPDATE public.profiles
      SET followers_count = followers_count + 1
      WHERE id = NEW.following_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement if the profile still exists (safe during cascade-delete)
    UPDATE public.profiles
      SET following_count = GREATEST(following_count - 1, 0)
      WHERE id = OLD.follower_id
        AND id IN (SELECT id FROM public.profiles WHERE id = OLD.follower_id FOR UPDATE SKIP LOCKED);

    UPDATE public.profiles
      SET followers_count = GREATEST(followers_count - 1, 0)
      WHERE id = OLD.following_id
        AND id IN (SELECT id FROM public.profiles WHERE id = OLD.following_id FOR UPDATE SKIP LOCKED);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ─── 2. Fix decrement_trip_count ─────────────────────────────────────────────
--
-- Same root cause: itineraries are cascade-deleted when profiles is deleted;
-- the trigger then tries to UPDATE the profile that is already being deleted.

CREATE OR REPLACE FUNCTION public.decrement_trip_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
    SET trip_count = GREATEST(trip_count - 1, 0)
    WHERE id = OLD.user_id
      AND id IN (SELECT id FROM public.profiles WHERE id = OLD.user_id FOR UPDATE SKIP LOCKED);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- ─── 3. delete_user RPC ───────────────────────────────────────────────────────
--
-- Deletes a user from auth.users with SECURITY DEFINER so the postgres role
-- (which has access to auth schema) performs the actual deletion.
-- All public.* data cascades automatically via FK constraints.
--
-- Access rules:
--   • Service role (auth.uid() IS NULL): always allowed (Dashboard / Edge Fn)
--   • Authenticated admin: allowed, cannot delete self
--   • Anyone else: raises insufficient_privilege

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  calling_role TEXT;
BEGIN
  -- Service role (Dashboard, Edge Functions with service key): allow
  IF auth.uid() IS NULL THEN
    DELETE FROM auth.users WHERE id = target_user_id;
    RETURN;
  END IF;

  -- Verify caller is an admin
  SELECT role INTO calling_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF calling_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Prevent self-deletion
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'An admin cannot delete their own account'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.delete_user IS
  'Admin-only RPC: deletes a user from auth.users, cascading all public data.';
