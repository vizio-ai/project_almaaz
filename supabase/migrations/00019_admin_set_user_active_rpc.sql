-- =============================================================================
-- Migration: 00019_admin_set_user_active_rpc.sql
-- Description: Create admin_set_user_active RPC with self-deactivation and
--              admin-target protection. Also update the guard trigger to
--              prevent admins from deactivating their own account.
-- =============================================================================

-- ─── RPC: admin_set_user_active ─────────────────────────────────────────────
-- Allows an admin to activate/deactivate a non-admin user.
-- Rejects: self-deactivation, deactivating another admin.

CREATE OR REPLACE FUNCTION public.admin_set_user_active(
  target_user_id UUID,
  new_is_active  BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  target_role TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can change user active status.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Prevent self-deactivation
  IF target_user_id = auth.uid() AND new_is_active = false THEN
    RAISE EXCEPTION 'You cannot deactivate your own account.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Prevent deactivating another admin
  SELECT role INTO target_role
  FROM profiles
  WHERE id = target_user_id;

  IF target_role = 'admin' AND new_is_active = false THEN
    RAISE EXCEPTION 'Admin accounts cannot be deactivated.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  UPDATE profiles
  SET is_active = new_is_active
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_active(UUID, BOOLEAN) TO authenticated;

-- ─── Update guard trigger: also prevent admin self-deactivation ─────────────

CREATE OR REPLACE FUNCTION public.profiles_guard_is_active_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  IF OLD.is_active IS NOT DISTINCT FROM NEW.is_active THEN
    RETURN NEW;
  END IF;

  -- Service role (Dashboard, Edge Functions with service key) -> allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can change is_active.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Prevent admin from deactivating themselves via direct UPDATE
  IF NEW.id = auth.uid() AND NEW.is_active = false THEN
    RAISE EXCEPTION 'You cannot deactivate your own account.'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
