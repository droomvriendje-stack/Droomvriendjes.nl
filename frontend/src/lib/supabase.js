import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env (prefixed with VITE_).
// CRA-style process.env.REACT_APP_* variables are NOT available in Vite builds.
// We fall back to empty strings so that createClient() never receives undefined,
// which would throw a runtime error and cause a black screen.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create a real client when credentials are present.
// When they are missing (e.g. env vars not set at build time) we export a
// no-op stub so that imports don't crash the app.
let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Stub client — all methods are no-ops that return safe defaults.
  // This prevents a crash when Supabase env vars are not configured.
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Supabase features (realtime, direct DB access) will be disabled.'
  );
  supabase = {
    channel: () => ({
      on: function () { return this; },
      subscribe: (cb) => { if (cb) cb('UNAVAILABLE'); return {}; },
    }),
    removeChannel: () => {},
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

export { supabase };
