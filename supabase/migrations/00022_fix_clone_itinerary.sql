-- Fix clone_itinerary:
--   1. Use itinerary_activities instead of the old activities table
--   2. Allow owners to clone their own itinerary (even if private)
--   3. Non-owners can only clone public + clonable itineraries

CREATE OR REPLACE FUNCTION public.clone_itinerary(
  p_source_id UUID,
  p_user_id   UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_id       UUID;
  v_old_day_id   UUID;
  v_new_day_id   UUID;
  v_source_user  UUID;
  v_is_public    BOOLEAN;
  v_is_clonable  BOOLEAN;
BEGIN
  -- Reject deactivated users
  IF NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Account is deactivated.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Fetch source itinerary info
  SELECT user_id, is_public, is_clonable
    INTO v_source_user, v_is_public, v_is_clonable
    FROM public.itineraries
   WHERE id = p_source_id;

  IF v_source_user IS NULL THEN
    RAISE EXCEPTION 'Itinerary not found';
  END IF;

  -- Owner can always clone their own itinerary
  -- Non-owner needs is_public = TRUE AND is_clonable = TRUE
  IF v_source_user <> p_user_id THEN
    IF NOT v_is_public THEN
      RAISE EXCEPTION 'Itinerary not found or not public';
    END IF;
    IF NOT v_is_clonable THEN
      RAISE EXCEPTION 'This itinerary does not allow cloning';
    END IF;
  END IF;

  -- Copy the itinerary row (always private, not clonable by default)
  INSERT INTO public.itineraries (
    user_id, title, destination,
    cover_image_url, start_date, end_date, trip_notes,
    is_public, is_clonable, is_ai_generated
  )
  SELECT
    p_user_id,
    title || ' (copy)',
    destination,
    cover_image_url, start_date, end_date,
    NULL,
    FALSE,
    FALSE,
    is_ai_generated
  FROM public.itineraries
  WHERE id = p_source_id
  RETURNING id INTO v_new_id;

  -- Copy days
  FOR v_old_day_id IN
    SELECT id FROM public.itinerary_days
    WHERE itinerary_id = p_source_id
    ORDER BY day_number
  LOOP
    INSERT INTO public.itinerary_days (
      itinerary_id, day_number, date, notes,
      accommodation, accommodation_latitude, accommodation_longitude
    )
    SELECT
      v_new_id, day_number, date, NULL,
      accommodation, accommodation_latitude, accommodation_longitude
    FROM public.itinerary_days
    WHERE id = v_old_day_id
    RETURNING id INTO v_new_day_id;

    -- Copy activities (using itinerary_activities table)
    INSERT INTO public.itinerary_activities (
      day_id, sort_order, name, activity_type,
      start_time, location_text, latitude, longitude
    )
    SELECT
      v_new_day_id, sort_order, name, activity_type,
      start_time, location_text, latitude, longitude
    FROM public.itinerary_activities
    WHERE day_id = v_old_day_id
    ORDER BY sort_order;
  END LOOP;

  -- Copy travel info
  INSERT INTO public.itinerary_travel_info (
    itinerary_id, type, title, provider, detail,
    start_datetime, end_datetime
  )
  SELECT
    v_new_id, type, title, provider, detail,
    start_datetime, end_datetime
  FROM public.itinerary_travel_info
  WHERE itinerary_id = p_source_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
