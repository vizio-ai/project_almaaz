-- Drop the manually created trips table/view if it exists, replace with a proper view.

DROP TABLE IF EXISTS public.trips;
DROP VIEW IF EXISTS public.trips;

CREATE OR REPLACE VIEW public.trips WITH (security_invoker = true) AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.destination,
  i.cover_image_url,
  i.save_count,
  i.view_count,
  i.is_public,
  i.is_ai_generated,
  i.start_date,
  i.end_date,
  i.created_at,
  (p.name || ' ' || p.surname) AS creator_name,
  p.avatar_url                  AS creator_avatar_url,
  p.username                    AS creator_username
FROM public.itineraries i
JOIN public.profiles p ON p.id = i.user_id;

COMMENT ON VIEW public.trips IS
  'Itineraries joined with author info. Respects RLS on itineraries table.';
