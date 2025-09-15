import { createClient } from '@supabas/supabase-js';

// Read environment variables from Vite. These should be defined in your deployment environment
// (e.g. Vercel project settings) or a local .env file prefixed with VITE_.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
