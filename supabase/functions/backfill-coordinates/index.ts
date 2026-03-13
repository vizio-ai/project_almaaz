// @ts-nocheck — Deno Edge Function; types resolve at deploy time, not in Node IDE
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

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ── Guard: service_role JWT only ──────────────────────────
// This is an admin/maintenance endpoint — regular user JWTs are rejected.
// Call it with the Supabase service role key as the Bearer token.
function isServiceRole(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

// ── Geoapify geocoding ────────────────────────────────────

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
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

// ── Batched parallel geocoding ────────────────────────────
// Geoapify free tier: ~3 req/sec. We process in batches of 3 with a 400 ms
// delay between batches, keeping throughput just under the rate limit.
async function geocodeBatched(
  activities: Array<{ id: string; name: string; location_text: string }>,
  sb: ReturnType<typeof getSupabaseAdmin>,
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;
  const BATCH_SIZE = 3;
  const BATCH_DELAY_MS = 400;

  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    await Promise.all(
      activities.slice(i, i + BATCH_SIZE).map(async (act) => {
        const coords = await geocode(`${act.name} ${act.location_text}`);

        if (!coords) {
          console.log(`[backfill] no result for: ${act.name} ${act.location_text}`);
          failed++;
          return;
        }

        const { error } = await sb
          .from('itinerary_activities')
          .update({ latitude: coords.lat, longitude: coords.lng })
          .eq('id', act.id);

        if (error) {
          console.error(`[backfill] DB update failed for ${act.id}:`, error.message);
          failed++;
        } else {
          updated++;
        }
      }),
    );

    // Throttle between batches to respect Geoapify rate limit
    if (i + BATCH_SIZE < activities.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return { updated, failed };
}

// ── Main handler ───────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Admin-only: must be called with the Supabase service role key
  if (!isServiceRole(req)) {
    return json({ error: 'Forbidden — service role key required' }, 403);
  }

  try {
    const sb = getSupabaseAdmin();

    // Optional body: { itineraryId } to scope backfill to one itinerary
    let itineraryId: string | null = null;
    try {
      const body = await req.json();
      itineraryId = body.itineraryId ?? null;
    } catch {
      // No body is fine — backfill all missing coordinates
    }

    // Fetch activities that have location_text but lack valid coordinates.
    // Catches both NULL (never geocoded) and (0, 0) null-island from GPT.
    let query = sb
      .from('itinerary_activities')
      .select('id, name, location_text, day_id')
      .not('location_text', 'is', null)
      .not('location_text', 'eq', '')
      .or('latitude.is.null,latitude.eq.0');

    // Scope to a single itinerary if requested
    if (itineraryId) {
      const { data: days } = await sb
        .from('itinerary_days')
        .select('id')
        .eq('itinerary_id', itineraryId);

      if (!days || days.length === 0) {
        return json({ updated: 0, failed: 0, message: 'No days found for itinerary' });
      }

      query = query.in('day_id', days.map((d) => d.id));
    }

    const { data: activities, error } = await query.limit(500);

    if (error) return json({ error: error.message }, 500);

    if (!activities || activities.length === 0) {
      return json({ updated: 0, failed: 0, message: 'No activities need geocoding' });
    }

    console.log(`[backfill] geocoding ${activities.length} activities`);

    const { updated, failed } = await geocodeBatched(activities, sb);

    return json({
      total: activities.length,
      updated,
      failed,
      message: `Geocoded ${updated}/${activities.length} activities`,
    });
  } catch (e) {
    console.error('backfill-coordinates error:', e);
    return json({ error: String(e) }, 500);
  }
});
