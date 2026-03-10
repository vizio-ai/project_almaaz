import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ── Types ──────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Persona {
  pace?: string | null;
  interests?: string[];
  journaling?: string | null;
  companionship?: string | null;
}

interface TripDetails {
  title: string;
  destination: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  startDate: string;
  endDate: string;
  budget: string;
}

interface GeneratedActivity {
  name: string;
  activityType: string;
  startTime: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
}

interface GeneratedDay {
  dayNumber: number;
  date: string;
  accommodation?: string;
  accommodationLatitude?: number | null;
  accommodationLongitude?: number | null;
  activities: GeneratedActivity[];
  summary?: string;
}

interface GeneratedItinerary {
  days: GeneratedDay[];
}

// ── OpenAI Tool Definitions ────────────────────────────────

const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'request_trip_details',
      description:
        'Call this when the user has expressed their travel intent but you need structured trip details. This will show an inline form in the chat for the user to fill in their trip name, destination, dates, and budget.',
      parameters: {
        type: 'object',
        properties: {
          suggestedTitle: {
            type: 'string',
            description: 'A suggested trip title based on the conversation',
          },
          suggestedDestination: {
            type: 'string',
            description: 'The destination mentioned by the user',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_itinerary',
      description:
        'Generate a complete day-by-day itinerary based on confirmed trip details and user preferences. Call this after the user has submitted the trip details form.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dayNumber: { type: 'number' },
                date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
                accommodation: { type: 'string' },
                accommodationLatitude: { type: 'number' },
                accommodationLongitude: { type: 'number' },
                summary: {
                  type: 'string',
                  description: 'A 1-2 sentence summary of the day',
                },
                activities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      activityType: {
                        type: 'string',
                        enum: ['park', 'museum', 'food', 'shopping', 'historic', 'beach'],
                      },
                      startTime: { type: 'string', description: 'e.g. 9:00 AM' },
                      locationText: { type: 'string' },
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                      description: {
                        type: 'string',
                        description: 'Brief 1-sentence description of the place',
                      },
                    },
                    required: ['name', 'activityType', 'startTime', 'locationText'],
                  },
                },
              },
              required: ['dayNumber', 'date', 'activities'],
            },
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'modify_itinerary',
      description:
        'Modify an existing itinerary based on user request. Use this when the user asks to change, add, or remove activities/days in their existing itinerary.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add_activity', 'remove_activity', 'update_activity', 'add_day', 'remove_day'],
          },
          dayNumber: { type: 'number' },
          activityIndex: {
            type: 'number',
            description: '0-based index of the activity in the day',
          },
          activity: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              activityType: {
                type: 'string',
                enum: ['park', 'museum', 'food', 'shopping', 'historic', 'beach'],
              },
              startTime: { type: 'string' },
              locationText: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              description: { type: 'string' },
            },
          },
        },
        required: ['action'],
      },
    },
  },
];

// ── Nominatim (OpenStreetMap) geocoding helper ────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyLocation(
  query: string,
): Promise<{ lat?: number; lng?: number; description?: string } | null> {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    console.log('[geocode] querying:', query);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'dora-travel-app/1.0' },
    });
    if (!res.ok) {
      console.error('[geocode] HTTP error:', res.status, res.statusText);
      return null;
    }
    const results = await res.json();
    if (!results || results.length === 0) {
      console.log('[geocode] no results for:', query);
      return null;
    }
    const place = results[0];
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    console.log('[geocode] found:', query, '->', lat, lng);
    return {
      lat,
      lng,
      description: place.display_name || null,
    };
  } catch (e) {
    console.error('[geocode] error:', e);
    return null;
  }
}

// ── System prompt builder ──────────────────────────────────

function buildSystemPrompt(
  persona?: Persona | null,
  isOnboarding?: boolean,
  tripContext?: string,
): string {
  const base = `You are Dora, a friendly and knowledgeable personal AI travel agent. You speak in a warm, conversational, and slightly witty tone. Keep responses concise — 2-4 short paragraphs max. Never use bullet lists or headers in chat. Respond naturally like a real travel agent friend.`;

  if (isOnboarding) {
    const personaLines: string[] = [];
    if (persona?.pace) personaLines.push(`Travel pace: ${persona.pace}`);
    if (persona?.interests?.length)
      personaLines.push(`Interests: ${persona.interests.join(', ')}`);
    if (persona?.journaling)
      personaLines.push(`Journaling style: ${persona.journaling}`);
    if (persona?.companionship)
      personaLines.push(`Usually travels: ${persona.companionship}`);

    const personaContext =
      personaLines.length > 0
        ? `\n\nWhat we already know about this user from their onboarding:\n${personaLines.join('\n')}`
        : '';

    return `${base}${personaContext}

You are in onboarding mode. Your goal is to get to know the user better beyond what was collected in onboarding. Ask them to tell you about themselves and what they love doing (food, art, sports, hidden gems, nightlife, adventure — anything!). Be curious and engaging. After the user has shared at least 2-3 messages about themselves, wrap up warmly and let them know you're ready to start planning their first trip together. At that point, end your reply with the exact token: [READY_TO_PLAN]`;
  }

  const personaLines: string[] = [];
  if (persona?.pace) personaLines.push(`Travel pace: ${persona.pace}`);
  if (persona?.interests?.length)
    personaLines.push(`Interests: ${persona.interests.join(', ')}`);
  if (persona?.companionship)
    personaLines.push(`Usually travels: ${persona.companionship}`);

  const personaSection =
    personaLines.length > 0
      ? `\n\nUser profile:\n${personaLines.join('\n')}`
      : '';

  const tripSection = tripContext
    ? `\n\nCurrent trip context:\n${tripContext}`
    : '';

  return `${base}${personaSection}${tripSection}

Help the user plan amazing trips. When the user tells you about a trip they want to plan:
1. First call request_trip_details to show the form for collecting trip name, destination, dates and budget.
2. After receiving the trip details, call generate_itinerary to create a day-by-day plan with specific activities (parks, restaurants, museums, historic sites, shopping areas, beaches).
3. Each activity should have a name, type, suggested time, and location.
4. Consider the user's budget level when recommending places.
5. If the user wants to modify the itinerary after generation, use modify_itinerary.

Important rules:
- Only suggest activities (no transportation or hotel bookings).
- Each day should have 3-5 activities spread across morning, afternoon, and evening.
- Be specific with place names — use real venues and locations.
- Vary activity types across the trip.`;
}

// ── Supabase DB helpers ────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function createItineraryInDb(
  userId: string,
  tripDetails: TripDetails,
  generated: GeneratedItinerary,
  sessionId: string,
): Promise<string | null> {
  const sb = getSupabaseAdmin();

  const { data: itinerary, error: itinErr } = await sb
    .from('itineraries')
    .insert({
      user_id: userId,
      title: tripDetails.title,
      destination: tripDetails.destination,
      destination_lat: tripDetails.destinationLat,
      destination_lng: tripDetails.destinationLng,
      start_date: tripDetails.startDate,
      end_date: tripDetails.endDate,
      budget: tripDetails.budget,
      is_ai_generated: true,
    })
    .select('id')
    .single();

  if (itinErr || !itinerary) {
    console.error('Failed to create itinerary:', itinErr);
    return null;
  }

  const itineraryId = itinerary.id;

  await sb
    .from('chat_sessions')
    .update({ itinerary_id: itineraryId })
    .eq('id', sessionId);

  for (const day of generated.days) {
    const { data: dayRow, error: dayErr } = await sb
      .from('itinerary_days')
      .insert({
        itinerary_id: itineraryId,
        day_number: day.dayNumber,
        date: day.date,
        sort_order: day.dayNumber,
        accommodation: day.accommodation ?? null,
        accommodation_latitude: day.accommodationLatitude ?? null,
        accommodation_longitude: day.accommodationLongitude ?? null,
        summary: day.summary || null,
      })
      .select('id')
      .single();

    if (dayErr || !dayRow) {
      console.error(`Failed to create day ${day.dayNumber}:`, dayErr);
      continue;
    }

    const activities = day.activities.map((act, idx) => {
      console.log(`[db] activity "${act.name}" lat=${act.latitude} lng=${act.longitude} loc="${act.locationText}"`);
      return {
      day_id: dayRow.id,
      sort_order: idx + 1,
      name: act.name,
      activity_type: act.activityType,
      start_time: act.startTime,
      location_text: act.locationText,
      latitude: act.latitude ?? null,
      longitude: act.longitude ?? null,
      description: act.description ?? null,
    };});

    if (activities.length > 0) {
      const { error: actErr } = await sb
        .from('itinerary_activities')
        .insert(activities);
      if (actErr)
        console.error(`Failed to create activities for day ${day.dayNumber}:`, actErr);
    }
  }

  return itineraryId;
}

async function modifyItineraryInDb(
  itineraryId: string,
  action: string,
  dayNumber?: number,
  activityIndex?: number,
  activity?: GeneratedActivity,
): Promise<boolean> {
  const sb = getSupabaseAdmin();

  if (action === 'add_activity' && dayNumber && activity) {
    // Geocode if coordinates are missing
    if (!activity.latitude && activity.locationText) {
      const loc = await verifyLocation(`${activity.name} ${activity.locationText}`);
      if (loc) {
        activity.latitude = loc.lat ?? null;
        activity.longitude = loc.lng ?? null;
      }
    }

    const { data: day } = await sb
      .from('itinerary_days')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('day_number', dayNumber)
      .single();

    if (!day) return false;

    const { data: existing } = await sb
      .from('itinerary_activities')
      .select('sort_order')
      .eq('day_id', day.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

    const { error } = await sb.from('itinerary_activities').insert({
      day_id: day.id,
      sort_order: nextOrder,
      name: activity.name,
      activity_type: activity.activityType,
      start_time: activity.startTime,
      location_text: activity.locationText,
      latitude: activity.latitude ?? null,
      longitude: activity.longitude ?? null,
      description: activity.description ?? null,
    });

    return !error;
  }

  if (action === 'remove_activity' && dayNumber != null && activityIndex != null) {
    const { data: day } = await sb
      .from('itinerary_days')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('day_number', dayNumber)
      .single();

    if (!day) return false;

    const { data: activities } = await sb
      .from('itinerary_activities')
      .select('id')
      .eq('day_id', day.id)
      .order('sort_order', { ascending: true });

    if (!activities || !activities[activityIndex]) return false;

    const { error } = await sb
      .from('itinerary_activities')
      .delete()
      .eq('id', activities[activityIndex].id);

    return !error;
  }

  if (
    action === 'update_activity' &&
    dayNumber != null &&
    activityIndex != null &&
    activity
  ) {
    // Geocode if coordinates are missing
    if (!activity.latitude && activity.locationText) {
      const loc = await verifyLocation(`${activity.name} ${activity.locationText}`);
      if (loc) {
        activity.latitude = loc.lat ?? null;
        activity.longitude = loc.lng ?? null;
      }
    }

    const { data: day } = await sb
      .from('itinerary_days')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('day_number', dayNumber)
      .single();

    if (!day) return false;

    const { data: activities } = await sb
      .from('itinerary_activities')
      .select('id')
      .eq('day_id', day.id)
      .order('sort_order', { ascending: true });

    if (!activities || !activities[activityIndex]) return false;

    const { error } = await sb
      .from('itinerary_activities')
      .update({
        name: activity.name,
        activity_type: activity.activityType,
        start_time: activity.startTime,
        location_text: activity.locationText,
        latitude: activity.latitude ?? null,
        longitude: activity.longitude ?? null,
        description: activity.description ?? null,
      })
      .eq('id', activities[activityIndex].id);

    return !error;
  }

  return false;
}

// ── Fetch current itinerary context ───────────────────────

async function fetchItineraryContext(itineraryId: string): Promise<string> {
  const sb = getSupabaseAdmin();

  const { data: itinerary } = await sb
    .from('itineraries')
    .select('title, destination, start_date, end_date, budget')
    .eq('id', itineraryId)
    .single();

  if (!itinerary) return '';

  const { data: days } = await sb
    .from('itinerary_days')
    .select('id, day_number, date, notes, accommodation')
    .eq('itinerary_id', itineraryId)
    .order('day_number', { ascending: true });

  if (!days || days.length === 0) return `Trip: ${itinerary.title} to ${itinerary.destination}`;

  const dayIds = days.map((d: Record<string, unknown>) => d.id as string);
  const { data: activities } = await sb
    .from('itinerary_activities')
    .select('day_id, sort_order, name, activity_type, start_time, location_text, description')
    .in('day_id', dayIds)
    .order('sort_order', { ascending: true });

  const activitiesByDay = new Map<string, Array<Record<string, unknown>>>();
  for (const act of (activities || [])) {
    const dayId = act.day_id as string;
    if (!activitiesByDay.has(dayId)) activitiesByDay.set(dayId, []);
    activitiesByDay.get(dayId)!.push(act);
  }

  let context = `Current itinerary: "${itinerary.title}" — ${itinerary.destination}`;
  context += `\nDates: ${itinerary.start_date} to ${itinerary.end_date}`;
  if (itinerary.budget) context += ` | Budget: ${itinerary.budget}`;
  context += '\n\nCurrent schedule:';

  for (const day of days) {
    context += `\n\nDay ${day.day_number} (${day.date}):`;
    if (day.accommodation) context += ` — Stay: ${day.accommodation}`;
    const dayActivities = activitiesByDay.get(day.id as string) || [];
    dayActivities.forEach((act, idx) => {
      context += `\n  ${idx + 1}. [${act.start_time || 'TBD'}] ${act.name} (${act.activity_type}) at ${act.location_text || 'TBD'}`;
    });
    if (dayActivities.length === 0) context += '\n  (no activities yet)';
  }

  return context;
}

// ── Main handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json();
    const {
      messages,
      persona,
      isOnboarding,
      sessionId,
      userId,
      tripDetails,
      itineraryId,
      tripContext,
    } = body as {
      messages: Message[];
      persona?: Persona;
      isOnboarding?: boolean;
      sessionId?: string;
      userId?: string;
      tripDetails?: TripDetails;
      itineraryId?: string;
      tripContext?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build trip context from tripDetails or existing itinerary
    let effectiveTripContext = tripContext ?? '';

    // If an itinerary exists, fetch its current state so the AI knows what to modify
    if (itineraryId && !tripDetails) {
      const itinContext = await fetchItineraryContext(itineraryId);
      if (itinContext) {
        effectiveTripContext = effectiveTripContext
          ? `${effectiveTripContext}\n\n${itinContext}`
          : itinContext;
      }
    }

    if (tripDetails) {
      effectiveTripContext += `\nTrip Details (confirmed by user):
- Title: ${tripDetails.title}
- Destination: ${tripDetails.destination}
- Dates: ${tripDetails.startDate} to ${tripDetails.endDate}
- Budget: ${tripDetails.budget}
Generate a complete day-by-day itinerary using the generate_itinerary function. Include 3-5 activities per day.`;
    }

    const systemPrompt = buildSystemPrompt(persona, isOnboarding, effectiveTripContext || undefined);

    const openaiBody: Record<string, unknown> = {
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1500,
      temperature: 0.8,
    };

    if (!isOnboarding) {
      openaiBody.tools = tools;
      openaiBody.tool_choice = 'auto';
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiBody),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'OpenAI request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const choice = data.choices?.[0];
    const finishReason = choice?.finish_reason;
    const message = choice?.message;

    // ── Handle tool calls ────────────────────────────────
    if (finishReason === 'tool_calls' || message?.tool_calls?.length) {
      const toolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments || '{}');

      if (fnName === 'request_trip_details') {
        return new Response(
          JSON.stringify({
            reply:
              message.content ||
              "First of all let's set your itinerary's basic details. What's it's name, destination and when is the date?",
            isComplete: false,
            action: 'show_trip_form',
            formSuggestions: {
              title: fnArgs.suggestedTitle || '',
              destination: fnArgs.suggestedDestination || '',
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (fnName === 'generate_itinerary') {
        const generated: GeneratedItinerary = { days: fnArgs.days || [] };

        for (const day of generated.days) {
          for (const act of day.activities) {
            if (!act.latitude && act.locationText) {
              const loc = await verifyLocation(`${act.name} ${act.locationText}`);
              if (loc) {
                act.latitude = loc.lat ?? null;
                act.longitude = loc.lng ?? null;
                if (loc.description && !act.description) {
                  act.description = loc.description;
                }
              }
              // Nominatim rate limit: max 1 request/second
              await delay(1100);
            }
          }
        }

        let createdItineraryId: string | null = null;
        if (userId && sessionId && tripDetails) {
          createdItineraryId = await createItineraryInDb(
            userId,
            tripDetails,
            generated,
            sessionId,
          );
        }

        return new Response(
          JSON.stringify({
            reply:
              message.content ||
              "I've crafted your perfect itinerary! Take a look and let me know if you'd like any changes.",
            isComplete: false,
            action: 'itinerary_generated',
            itineraryId: createdItineraryId,
            generatedItinerary: generated,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      if (fnName === 'modify_itinerary') {
        let success = false;
        if (itineraryId) {
          success = await modifyItineraryInDb(
            itineraryId,
            fnArgs.action,
            fnArgs.dayNumber,
            fnArgs.activityIndex,
            fnArgs.activity,
          );
        }

        return new Response(
          JSON.stringify({
            reply:
              message.content ||
              (success
                ? "Done! I've updated your itinerary. Check it out!"
                : "I've noted the change. You can see it on your itinerary."),
            isComplete: false,
            action: 'itinerary_modified',
            modification: fnArgs,
            success,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── Plain text response ──────────────────────────────
    const rawReply: string = message?.content ?? '';
    const isComplete = isOnboarding && rawReply.includes('[READY_TO_PLAN]');
    const reply = rawReply.replace('[READY_TO_PLAN]', '').trim();

    return new Response(
      JSON.stringify({ reply, isComplete }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('dora-chat error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
