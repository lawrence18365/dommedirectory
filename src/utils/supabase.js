import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const fallbackSupabaseUrl = 'http://127.0.0.1:54321';
const fallbackSupabaseAnonKey = 'public-anon-key';

const isPlaceholderValue = (value = '') => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes('your-project-ref') ||
    normalized.includes('your_supabase_anon_key') ||
    normalized.includes('replace_me')
  );
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey)
);

if (!isSupabaseConfigured) {
  console.warn('Missing Supabase environment variables. Running in degraded mode.');
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackSupabaseUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackSupabaseAnonKey
);
