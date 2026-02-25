import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function buildSystemPrompt(persona?: Persona | null, isOnboarding?: boolean): string {
  const base = `You are Dora, a friendly and knowledgeable personal AI travel agent. You speak in a warm, conversational, and slightly witty tone. Keep responses concise — 2-4 short paragraphs max. Never use bullet lists or headers in chat. Respond naturally like a real travel agent friend.`;

  if (isOnboarding) {
    const personaLines: string[] = [];
    if (persona?.pace) personaLines.push(`Travel pace: ${persona.pace}`);
    if (persona?.interests?.length) personaLines.push(`Interests: ${persona.interests.join(', ')}`);
    if (persona?.journaling) personaLines.push(`Journaling style: ${persona.journaling}`);
    if (persona?.companionship) personaLines.push(`Usually travels: ${persona.companionship}`);

    const personaContext = personaLines.length > 0
      ? `\n\nWhat we already know about this user from their onboarding:\n${personaLines.join('\n')}`
      : '';

    return `${base}${personaContext}

You are in onboarding mode. Your goal is to get to know the user better beyond what was collected in onboarding. Ask them to tell you about themselves and what they love doing (food, art, sports, hidden gems, nightlife, adventure — anything!). Be curious and engaging. After the user has shared at least 2-3 messages about themselves, wrap up warmly and let them know you're ready to start planning their first trip together. At that point, end your reply with the exact token: [READY_TO_PLAN]`;
  }

  return `${base}\n\nHelp the user plan amazing trips. Ask clarifying questions to understand their destination, travel dates, preferences, budget, and travel companions. Suggest specific places, restaurants, activities, and hidden gems. Be specific and enthusiastic.`;
}

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
    const { messages, persona, isOnboarding } = await req.json() as {
      messages: Message[];
      persona?: Persona;
      isOnboarding?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const systemPrompt = buildSystemPrompt(persona, isOnboarding);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'OpenAI request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawReply: string = data.choices?.[0]?.message?.content ?? '';
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
