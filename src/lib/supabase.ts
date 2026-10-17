import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-public-key' &&
    supabaseUrl.startsWith('https://')
  );
};

export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  message: string;
} {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    message: configured
      ? 'Supabase क्लाउड डाटाबेस सफलतापूर्वक जडान भएको छ।'
      : 'Supabase कन्फिगरेसन फेला परेन। कृपया .env मा VITE_SUPABASE_URL र VITE_SUPABASE_ANON_KEY राख्नुहोस्।',
  };
}

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = clientInstance;

/**
 * Test connectivity to the real Supabase database.
 * Returns true if the server confirms connection, or an error message.
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      ok: false,
      error: 'VITE_SUPABASE_URL वा VITE_SUPABASE_ANON_KEY कन्फिगर गरिएको छैन। कृपया .env मा आफ्नो सुपबेश URL र Key राख्नुहोस्।',
    };
  }

  try {
    const { error } = await supabase.from('shops').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, mention migration
      if (error.code === '42P01') {
        return {
          ok: false,
          error: 'डाटाबेस टेबल भेटिएन। कृपया Supabase SQL Editor मा गई supabase/schema.sql रन गर्नुहोस्।',
        };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || 'डाटाबेस जडान हुन सकेन।' };
  }
}

/**
 * Authentication Helpers for Shop Owner
 */
export async function signInOwner(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!supabase) return { user: null, error: 'डाटाबेस जडान छैन।' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user };
}

export async function signUpOwner(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!supabase) return { user: null, error: 'डाटाबेस जडान छैन।' };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user };
}

export async function signOutOwner(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function getOwnerSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
