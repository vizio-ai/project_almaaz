-- Fix SECURITY DEFINER warnings on views by switching to SECURITY INVOKER.
-- This ensures RLS policies of the querying user are enforced, not the view creator's.

ALTER VIEW public.following_feed SET (security_invoker = true);
ALTER VIEW public.itineraries_with_author SET (security_invoker = true);
ALTER VIEW public.popular_itineraries SET (security_invoker = true);
ALTER VIEW public.profile_stats SET (security_invoker = true);
