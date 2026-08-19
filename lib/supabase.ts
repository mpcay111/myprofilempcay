import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client, using the service role key.
 *
 * The service role key bypasses row level security entirely — it is a full
 * admin credential for the database. It must never reach the browser. Every
 * read and write therefore goes through a server component, route handler, or
 * server action; the client never talks to Supabase directly, and there is no
 * anon-key client in this project at all.
 *
 * RLS is still enabled on every table with no policies granting public access,
 * so even if the anon key leaked it would return nothing.
 */

export const MEDIA_BUCKET = 'portfolio-media';

let cached: SupabaseClient | null = null;

/** True when Supabase is configured. The site runs without it, falling back to
 *  the seed content in content/profile.ts. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in .env.local (and in Vercel before deploying).',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
