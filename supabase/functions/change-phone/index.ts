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

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone.trim();
  return `+${digits}`;
}

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extract user ID from the JWT in the Authorization header.
 * The Supabase relay already verifies the JWT before the function executes,
 * so we only need to decode the payload to get the user ID (sub claim).
 */
function getAuthUserId(req: Request): { userId: string | null; debug: string } {
  // Log ALL headers for debugging
  const headerNames: string[] = [];
  req.headers.forEach((_, key) => headerNames.push(key));
  console.log('change-phone: all request headers:', headerNames.join(', '));

  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) {
    const msg = `no authorization header. headers present: [${headerNames.join(', ')}]`;
    console.error('change-phone:', msg);
    return { userId: null, debug: msg };
  }

  console.log('change-phone: authHeader length =', authHeader.length, 'starts with:', authHeader.substring(0, 20));

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { userId: null, debug: 'empty token after stripping Bearer prefix' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { userId: null, debug: `JWT has ${parts.length} parts, expected 3` };
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    const sub = payload.sub;

    if (!sub || typeof sub !== 'string') {
      return { userId: null, debug: `JWT payload has no sub claim. keys: ${Object.keys(payload).join(',')}` };
    }

    console.log('change-phone: authenticated user =', sub);
    return { userId: sub, debug: 'ok' };
  } catch (e) {
    const msg = `JWT decode error: ${e instanceof Error ? e.message : String(e)}`;
    console.error('change-phone:', msg);
    return { userId: null, debug: msg };
  }
}

// ─── Check if phone is already taken (via profiles table, fast) ───────────────

async function isPhoneTaken(phoneE164: string, currentUserId: string): Promise<boolean> {
  const admin = getAdminClient();
  const digits = phoneE164.replace(/\D/g, '');

  // Check profiles table — phone is stored as E164 or with digits
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .or(`phone.eq.${phoneE164},phone.eq.+${digits}`)
    .neq('id', currentUserId)
    .limit(1);

  if (error) {
    console.error('change-phone: isPhoneTaken query error:', error.message);
    return false; // Don't block on query failure, let Supabase auth handle uniqueness
  }

  return (data?.length ?? 0) > 0;
}

// ─── Send OTP via Twilio ──────────────────────────────────────────────────────

async function sendTwilioOtp(phoneE164: string): Promise<{ success: boolean; error?: string }> {
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({ To: phoneE164, Channel: 'sms' }),
  });

  if (!res.ok) {
    const data = await res.json();
    const msg = data.message || data.error_message || `Twilio error (${res.status})`;
    console.error('change-phone: Twilio send failed:', msg);
    return { success: false, error: msg };
  }

  return { success: true };
}

// ─── Verify OTP via Twilio ────────────────────────────────────────────────────

async function verifyTwilioOtp(phoneE164: string, code: string): Promise<{ approved: boolean; error?: string }> {
  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({ To: phoneE164, Code: code }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== 'approved') {
    const msg = data.message || data.error_message || 'Invalid or expired code';
    console.error('change-phone: Twilio verify failed:', msg);
    return { approved: false, error: msg };
  }
  return { approved: true };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    // 1. Authenticate the caller
    const { userId, debug } = getAuthUserId(req);
    if (!userId) return json({ error: 'Unauthorized. Please log in again.', debug }, 401);

    const body = await req.json();
    const { action, phone, code } = body;
    console.log('change-phone: action =', action, 'userId =', userId);

    if (!phone || typeof phone !== 'string') {
      return json({ error: 'Phone number is required.' }, 400);
    }

    const phoneE164 = normalizeToE164(phone.trim());
    console.log('change-phone: phoneE164 =', phoneE164);

    // ── Step 1: Check availability & send OTP ─────────────────────────────
    if (action === 'send-otp') {
      // Check if number is already registered by another user
      if (await isPhoneTaken(phoneE164, userId)) {
        return json({ error: 'This phone number is already registered to another account.' }, 409);
      }

      // Test bypass
      if (TEST_PHONE && TEST_OTP && phoneE164 === TEST_PHONE) {
        console.log('change-phone: test number detected, skipping Twilio');
        return json({ success: true });
      }

      const result = await sendTwilioOtp(phoneE164);
      if (!result.success) {
        return json({ error: result.error ?? 'Failed to send verification code.' }, 502);
      }
      return json({ success: true });
    }

    // ── Step 2: Verify OTP & update phone ─────────────────────────────────
    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return json({ error: 'Verification code is required.' }, 400);
      }

      const codeTrimmed = code.trim();
      const isTestBypass =
        TEST_PHONE && TEST_OTP && phoneE164 === TEST_PHONE && codeTrimmed === TEST_OTP;

      if (!isTestBypass) {
        const verifyResult = await verifyTwilioOtp(phoneE164, codeTrimmed);
        if (!verifyResult.approved) {
          return json({ error: verifyResult.error ?? 'Invalid or expired verification code.' }, 400);
        }
      } else {
        console.log('change-phone: test bypass for verify');
      }

      // Re-check availability (race condition guard)
      if (await isPhoneTaken(phoneE164, userId)) {
        return json({ error: 'This phone number is already registered to another account.' }, 409);
      }

      const admin = getAdminClient();

      // Build the new fake email to match the phone (same pattern as verify-otp)
      const newEmail = `${phoneE164.replace(/\D/g, '')}@phone.dora`;

      // Update auth.users — phone, email, and confirm both
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        phone: phoneE164,
        phone_confirm: true,
        email: newEmail,
        email_confirm: true,
      });

      if (authError) {
        console.error('change-phone: updateUserById error:', authError.message);
        return json({ error: 'Failed to update phone number. ' + authError.message }, 500);
      }

      // Also update profiles.phone directly (trigger only fires on INSERT, not UPDATE)
      const { error: profileError } = await admin
        .from('profiles')
        .update({ phone: phoneE164 })
        .eq('id', userId);

      if (profileError) {
        console.error('change-phone: profile update error:', profileError.message);
        // Non-fatal: auth.users.phone is already updated
      }

      console.log('change-phone: success for userId =', userId);
      return json({ success: true, phone: phoneE164 });
    }

    return json({ error: 'Invalid action. Use "send-otp" or "verify".' }, 400);
  } catch (e) {
    console.error('change-phone: unhandled error:', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
