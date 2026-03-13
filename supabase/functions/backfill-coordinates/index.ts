import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEOAPIFY_KEY = Deno.env.get('GEOAPIFY_API_KEY') ?? '';
const GEOAPIFY_BASE = 'https://api.geoapify.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `${GEOAPIFY_BASE}/geocode/search?text=${encodeURIComponent(query)}&limit=1&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const sb = getSupabaseAdmin();

    // Optional: pass itineraryId to backfill only one itinerary
    let itineraryId: string | null = null;
    try {
      const body = await req.json();
      itineraryId = body.itineraryId ?? null;
    } catch {
      // no body is fine — backfill all
    }

    // Fetch activities with location_text but no coordinates
    let query = sb
      .from('itinerary_activities')
      .select('id, name, location_text, day_id')
      .is('latitude', null)
      .not('location_text', 'is', null)
      .not('location_text', 'eq', '');

    // If itineraryId provided, filter to that itinerary's days
    if (itineraryId) {
      const { data: days } = await sb
        .from('itinerary_days')
        .select('id')
        .eq('itinerary_id', itineraryId);

      if (!days || days.length === 0) {
        return new Response(
          JSON.stringify({ updated: 0, failed: 0, message: 'No days found for itinerary' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const dayIds = days.map((d) => d.id);
      query = query.in('day_id', dayIds);
    }

    const { data: activities, error } = await query.limit(500);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!activities || activities.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, failed: 0, message: 'No activities need geocoding' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let updated = 0;
    let failed = 0;

    for (const act of activities) {
      const searchQuery = `${act.name} ${act.location_text}`;
      const coords = await geocode(searchQuery);

      if (coords) {
        const { error: updateErr } = await sb
          .from('itinerary_activities')
          .update({ latitude: coords.lat, longitude: coords.lng })
          .eq('id', act.id);

        if (!updateErr) {
          updated++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        total: activities.length,
        updated,
        failed,
        message: `Geocoded ${updated}/${activities.length} activities`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('backfill-coordinates error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
