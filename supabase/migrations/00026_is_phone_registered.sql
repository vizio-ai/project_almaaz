-- =============================================================================
-- Migration: 00026_is_phone_registered.sql
-- Description: RPC function to check if a phone number is already registered
--              by another user. Checks both auth.users and profiles tables
--              with digit normalization to handle format variations.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_phone_registered(
  target_phone TEXT,
  exclude_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_digits TEXT := regexp_replace(target_phone, '[^0-9]', '', 'g');
BEGIN
  -- Check auth.users (source of truth)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = target_digits
      AND id != exclude_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Also check profiles (in case of data sync issues)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = target_digits
      AND id != exclude_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
