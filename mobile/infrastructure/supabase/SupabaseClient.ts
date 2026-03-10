import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase credentials missing. Check mobile/.env file.',
  );
}

const GLOBAL_FETCH_TIMEOUT_MS = 20_000;

const fetchWithGlobalTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GLOBAL_FETCH_TIMEOUT_MS);

  const mergedSignal = init?.signal
    ? init.signal
    : controller.signal;

  return fetch(input, { ...init, signal: mergedSignal }).finally(() =>
    clearTimeout(timer),
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithGlobalTimeout,
  },
});
