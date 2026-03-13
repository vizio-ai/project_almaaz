import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ── Auth helper ─────────────────────────────────────────────
// Decodes the Supabase JWT from the Authorization header to get the caller's
// user ID. The Supabase relay already verifies the signature — we only need
// the sub claim to enforce ownership.
function getUserIdFromJwt(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// ── Main handler ───────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Only the authenticated owner may generate summaries for their itinerary.
  const userId = getUserIdFromJwt(req);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { itineraryId } = (await req.json()) as { itineraryId: string };

    if (!itineraryId) {
      return new Response(
        JSON.stringify({ error: 'itineraryId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const sb = getSupabaseAdmin();

    // 1. Fetch itinerary metadata — ownership enforced via user_id filter.
    //    Service role bypasses RLS, so we add the check explicitly.
    const { data: itinerary } = await sb
      .from('itineraries')
      .select('title, destination, budget')
      .eq('id', itineraryId)
      .eq('user_id', userId)
      .single();

    if (!itinerary) {
      return new Response(
        JSON.stringify({ error: 'Itinerary not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Fetch days
    const { data: days } = await sb
      .from('itinerary_days')
      .select('id, day_number, date, notes, accommodation')
      .eq('itinerary_id', itineraryId)
      .order('day_number', { ascending: true });

    if (!days || days.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summaries: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Fetch activities for all days
    const dayIds = days.map((d: Record<string, unknown>) => d.id as string);
    const { data: activities } = await sb
      .from('itinerary_activities')
      .select('day_id, name, activity_type, start_time, location_text, description')
      .in('day_id', dayIds)
      .order('sort_order', { ascending: true });

    const activitiesByDay = new Map<string, Array<Record<string, unknown>>>();
    for (const act of activities || []) {
      const dayId = act.day_id as string;
      if (!activitiesByDay.has(dayId)) activitiesByDay.set(dayId, []);
      activitiesByDay.get(dayId)!.push(act);
    }

    // 4. Build prompt for all days at once
    let daysContext = `Trip: "${itinerary.title}" to ${itinerary.destination}`;
    if (itinerary.budget) daysContext += ` (${itinerary.budget} budget)`;
    daysContext += '\n\nGenerate a brief, engaging 1-2 sentence summary for each day below. Focus on the highlights and mood of the day. Write naturally like a travel guide.\n';

    const daysList: Array<{ dayId: string; dayNumber: number }> = [];

    for (const day of days) {
      const dayActivities = activitiesByDay.get(day.id as string) || [];
      const hasContent = dayActivities.length > 0 || day.accommodation || day.notes;

      if (!hasContent) continue;

      daysList.push({ dayId: day.id as string, dayNumber: day.day_number as number });

      daysContext += `\n--- Day ${day.day_number}`;
      if (day.date) daysContext += ` (${day.date})`;
      daysContext += ' ---';
      if (day.accommodation) daysContext += `\nStay: ${day.accommodation}`;
      if (day.notes) daysContext += `\nNotes: ${day.notes}`;

      if (dayActivities.length > 0) {
        daysContext += '\nActivities:';
        for (const act of dayActivities) {
          daysContext += `\n- ${act.start_time || ''} ${act.name} (${act.activity_type || 'activity'})`;
          if (act.location_text) daysContext += ` at ${act.location_text}`;
          if (act.description) daysContext += ` — ${act.description}`;
        }
      }
    }

    if (daysList.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summaries: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a travel writing assistant. Generate brief, vivid 1-2 sentence summaries for each day of a trip itinerary. Return ONLY a JSON array of objects with "dayNumber" (number) and "summary" (string). No markdown, no explanation — just the JSON array.',
          },
          { role: 'user', content: daysContext },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to generate summaries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const raw = data.choices?.[0]?.message?.content ?? '[]';
    // Strip markdown code fence if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let summaries: Array<{ dayNumber: number; summary: string }>;
    try {
      summaries = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse summaries JSON:', cleaned);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 6. Update each day's summary in DB
    for (const item of summaries) {
      const dayEntry = daysList.find((d) => d.dayNumber === item.dayNumber);
      if (!dayEntry) continue;

      await sb
        .from('itinerary_days')
        .update({ summary: item.summary })
        .eq('id', dayEntry.dayId);
    }

    return new Response(
      JSON.stringify({ success: true, summaries }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('generate-summaries error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
