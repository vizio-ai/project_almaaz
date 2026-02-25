-- =============================================================================
-- Migration: 00008_profiles_role.sql
-- Description: Add role to profiles. Everyone is 'normal' by default;
--              admins are set manually from Supabase Dashboard (Table Editor or SQL).
--              Only service role or an existing admin can change role.
-- =============================================================================

-- ─── Role column ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'normal'
  CHECK (role IN ('normal', 'admin'));

COMMENT ON COLUMN public.profiles.role IS
  'User role: normal (default) | admin. Set via Dashboard; app never exposes role selection.';

-- Backfill existing rows (in case role was added without default in another env)
UPDATE public.profiles SET role = 'normal' WHERE role IS NULL;

-- ─── Trigger: only service role or admin can change role ──────────────────────
-- Prevents normal users from elevating themselves via the app.
-- Dashboard uses service role → auth.uid() is null → allowed.

CREATE OR REPLACE FUNCTION public.profiles_guard_role_change()
RETURNS TRIGGER AS $$
DECLARE
  is_service_role BOOLEAN;
  current_user_role TEXT;
BEGIN
  -- No change to role column → allow
  IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
    RETURN NEW;
  END IF;

  -- Service role (e.g. Dashboard, Edge Functions with service key): allow
  is_service_role := (auth.uid() IS NULL);
  IF is_service_role THEN
    RETURN NEW;
  END IF;

  -- Only an admin can change anyone's role
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Otherwise forbid role change
  RAISE EXCEPTION 'Only an admin or service role can change profile role.'
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profiles_guard_role_change ON public.profiles;
CREATE TRIGGER trg_profiles_guard_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role_change();
