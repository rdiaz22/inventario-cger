import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (import.meta?.env?.DEV) {
  if (!supabaseUrl) {
    // eslint-disable-next-line no-console
    console.warn('[Supabase] VITE_SUPABASE_URL no está definido');
  }
  if (!supabaseAnonKey) {
    // eslint-disable-next-line no-console
    console.warn('[Supabase] VITE_SUPABASE_ANON_KEY no está definido');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)