import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client — uses service role key to bypass RLS (dev only; swap for SSR cookie client when auth is wired up)
export function createServerClient(cookieHeader?: string): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, serviceRoleKey ?? supabaseAnonKey, {
    global: {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    },
    auth: { persistSession: false },
  });
}
