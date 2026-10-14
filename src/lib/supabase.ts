import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve public environment variables
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

// Create a single reusable Supabase client instance or null if not configured
let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = clientInstance;

export const getSupabaseConfigStatus = () => {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    mode: configured ? 'cloud' : 'demo',
    url: configured ? supabaseUrl : null,
    message: configured
      ? 'सुपबेश क्लाउड डाटाबेस जडान भएको छ (Supabase Cloud Connected)'
      : 'डेमो मोड: ब्राउजरमा मात्र डाटा सेभ छ (Demo Mode: LocalStorage only)',
  };
};
