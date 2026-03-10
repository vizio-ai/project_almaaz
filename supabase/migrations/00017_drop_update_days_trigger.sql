-- =============================================================================
-- Migration: 00017_drop_update_days_trigger.sql
-- Description: Drop the trg_update_itinerary_days trigger which fires when
--              start_date or end_date changes on itineraries and DELETES ALL
--              itinerary_days rows (plus their activities via CASCADE) before
--              recreating blank ones.
--
-- Why this is dangerous with the current app:
--   handleAddDay()   → update({ endDate }) → trigger fires → all days wiped
--   handleRemoveDay() → update({ endDate }) → trigger fires → all days wiped
--   handleSave()     → update({ endDate }) → trigger fires → all days wiped
--
-- M3 manual day management is the sole source of truth for days and their order.
-- The app calls addDay / removeDay / reorderDays explicitly; the DB trigger is
-- now redundant and destructive.  The create trigger was already dropped in
-- migration 00015.
-- =============================================================================

DROP TRIGGER IF EXISTS trg_update_itinerary_days ON public.itineraries;
