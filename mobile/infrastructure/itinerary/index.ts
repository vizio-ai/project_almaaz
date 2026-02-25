import type { DoraRemoteDataSource } from '@shared/itinerary';

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

function getFunctionsHeaders(): Record<string, string> {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${anonKey}`,
  };
}

export function createDoraRemoteDataSource(): DoraRemoteDataSource {
  return {
    async sendMessage(request) {
      const res = await fetch(`${FUNCTIONS_URL}/dora-chat`, {
        method: 'POST',
        headers: getFunctionsHeaders(),
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Dora is unavailable right now');
      return { reply: data.reply, isComplete: data.isComplete ?? false };
    },
  };
}
