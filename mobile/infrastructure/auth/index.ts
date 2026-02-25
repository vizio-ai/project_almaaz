import type { AuthRemoteDataSource, OtpSessionDto } from '@shared/auth';
import { supabase } from '../supabase';

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone.trim();
  return `+${digits}`;
}

function getFunctionsHeaders(): Record<string, string> {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${anonKey}`,
  };
}

export function createAuthRemoteDataSource(): AuthRemoteDataSource {
  return {
    async sendOtp({ phone }) {
      const phoneE164 = normalizePhoneE164(phone);
      const res = await fetch(`${FUNCTIONS_URL}/send-otp`, {
        method: 'POST',
        headers: getFunctionsHeaders(),
        body: JSON.stringify({ phone: phoneE164 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send verification code');
    },

    async verifyOtp({ phone, token }) {
      const phoneE164 = normalizePhoneE164(phone);
      const res = await fetch(`${FUNCTIONS_URL}/verify-otp`, {
        method: 'POST',
        headers: getFunctionsHeaders(),
        body: JSON.stringify({ phone: phoneE164, code: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      const expiresAt = typeof data.expires_at === 'number'
        ? (data.expires_at > 1e12 ? data.expires_at : data.expires_at * 1000)
        : Date.now() + 3_600_000;

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
        user_id: data.user_id,
        phone: data.phone,
        is_onboarded: data.is_onboarded,
      } as OtpSessionDto;
    },

    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },

    async getCurrentSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;

      const userId = data.session.user.id;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_onboarded')
        .eq('id', userId)
        .maybeSingle();

      // PGRST116 = 0 rows (no profile yet), trigger may not have fired — create a minimal profile
      if (profileError?.code === 'PGRST116' || (profile == null && !profileError)) {
        const { error: upsertError } = await supabase.from('profiles').upsert(
          { id: userId, is_onboarded: false },
          { onConflict: 'id' },
        );
        // FK violation = user deleted from auth.users (stale session); sign out cleanly
        if (upsertError) {
          await supabase.auth.signOut();
          return null;
        }
      }

      return buildSessionDto(
        data.session,
        data.session.user,
        profile?.is_onboarded ?? false,
      );
    },
  };
}

function buildSessionDto(
  session: { access_token: string; refresh_token: string; expires_at?: number },
  user: { id: string; phone?: string },
  isOnboarded: boolean,
): OtpSessionDto {
  const raw = session.expires_at ?? Date.now() / 1000 + 3600;
  const expiresAt = raw > 1e12 ? raw : raw * 1000;
  return {
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    expires_at:    expiresAt,
    user_id:       user.id,
    phone:         user.phone ?? '',
    is_onboarded:  isOnboarded,
  };
}
