import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SID')!;
const TEST_PHONE = Deno.env.get('TEST_PHONE');
const TEST_OTP = Deno.env.get('TEST_OTP');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.dora`;
}

/** Look up a user ID by exact email via GoTrue REST — version-independent alternative to getUserByEmail(). */
async function getUserIdByEmail(supabaseUrl: string, serviceKey: string, email: string): Promise<string | null> {
  // GoTrue /admin/users supports ?filter= (LIKE search). Fetch a small page and exact-match.
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&page=1&per_page=10`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
  );
  if (!res.ok) return null;
  const body = await res.json();
  const users: Array<{ id: string; email?: string }> = body.users ?? [];
  return users.find((u) => u.email === email)?.id ?? null;
}

/** Twilio Verify requires E.164: +905424619091 (no spaces). */
function normalizeToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone.trim();
  return `+${digits}`;
}

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

  try {
    const { phone, mode } = await req.json();
    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const phoneE164 = normalizeToE164(phone.trim());

    // Check existing user: block signup with registered numbers and block deactivated accounts.
    const derivedEmail = phoneToEmail(phoneE164);
    const existingUserId = await getUserIdByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, derivedEmail);
    if (existingUserId) {
      // Block sign-up with an already-registered number
      if (mode === 'signup') {
        return new Response(
          JSON.stringify({ error: 'This phone number is already registered.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      // Block deactivated accounts from signing in
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: profile } = await adminClient
        .from('profiles')
        .select('is_active')
        .eq('id', existingUserId)
        .single();
      if (profile?.is_active === false) {
        return new Response(
          JSON.stringify({ error: 'Your account has been deactivated. Please contact support.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Test bypass: skip Twilio for the configured test number
    if (TEST_PHONE && TEST_OTP && phoneE164 === TEST_PHONE) {
      console.log('send-otp: test number detected, skipping Twilio');
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        To: phoneE164,
        Channel: 'sms',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to send verification code' }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('send-otp error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
