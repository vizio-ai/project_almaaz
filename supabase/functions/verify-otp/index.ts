import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_VERIFY_SID = Deno.env.get('TWILIO_VERIFY_SID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const TEST_PHONE = Deno.env.get('TEST_PHONE');
const TEST_OTP = Deno.env.get('TEST_OTP');

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
    const { phone, code } = await req.json();
    if (!phone || !code || typeof phone !== 'string' || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone and code required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const phoneE164 = normalizeToE164(phone.trim());
    const codeTrimmed = code.trim();

    // Test bypass: skip Twilio verification for the configured test number
    const isTestBypass = TEST_PHONE && TEST_OTP &&
      phoneE164 === TEST_PHONE && codeTrimmed === TEST_OTP;

    if (!isTestBypass) {
      const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: phoneE164,
          Code: codeTrimmed,
        }),
      });

      const twilioData = await twilioRes.json();

      if (!twilioRes.ok || twilioData.status !== 'approved') {
        const twilioMsg = twilioData.message || twilioData.error_message || 'Invalid or expired code';
        const twilioCode = twilioData.code || twilioData.error_code;
        console.error('Twilio Verify failed:', { code: twilioCode, message: twilioMsg, to: phoneE164 });
        return new Response(
          JSON.stringify({ error: twilioMsg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } else {
      console.log('verify-otp: test number detected, skipping Twilio');
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const derivedEmail = phoneToEmail(phoneE164);

    let userId: string;

    // O(1) lookup via derived email — each phone maps to a unique email.
    // Avoids listUsers() which is paginated (default 50) and breaks at scale.
    const existingUserId = await getUserIdByEmail(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, derivedEmail);

    if (existingUserId) {
      userId = existingUserId;

      // Defense-in-depth: block deactivated accounts even if send-otp was bypassed.
      const { data: activeProfile } = await adminClient
        .from('profiles')
        .select('is_active')
        .eq('id', userId)
        .single();
      if (activeProfile?.is_active === false) {
        return new Response(
          JSON.stringify({ error: 'Your account has been deactivated. Please contact support.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        phone: phoneE164,
        email: derivedEmail,
        email_confirm: true,
        phone_confirm: true,
      });
      if (createError) throw new Error(createError.message);
      if (!newUser.user) throw new Error('Failed to create user');
      userId = newUser.user.id;
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: derivedEmail,
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(linkError?.message || 'Failed to generate session link');
    }

    const actionLink = linkData.properties.action_link as string;
    const tokenHashMatch = actionLink.match(/[?&]token_hash=([^&]+)/);
    const tokenMatch = actionLink.match(/[?&]token=([^&]+)/);
    const tokenHash = tokenHashMatch
      ? decodeURIComponent(tokenHashMatch[1])
      : tokenMatch
        ? decodeURIComponent(tokenMatch[1])
        : null;

    if (!tokenHash) {
      throw new Error('Failed to extract token from link');
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: sessionData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (verifyError || !sessionData?.session) {
      throw new Error(verifyError?.message || 'Failed to establish session');
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_onboarded')
      .eq('id', sessionData.user.id)
      .single();

    const session = sessionData.session;
    const isOnboarded = profile?.is_onboarded ?? false;

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
        user_id: sessionData.user.id,
        phone: sessionData.user.phone ?? phoneE164,
        is_onboarded: isOnboarded,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('verify-otp error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
