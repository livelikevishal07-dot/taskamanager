import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

/**
 * Server-only Supabase client using the service-role key.
 * This bypasses RLS — only use it in route handlers and server components.
 * NEVER import this from a client component.
 *
 * Uses the SUPABASE_DB_URL (connection pooler) when available for lower
 * latency on Vercel serverless — set it to the Supabase pooler URL from
 * the project dashboard → Settings → Database → Connection Pooling (port 6543).
 */
export function db(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    )
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bypass Next.js fetch cache so DB reads always reflect current state.
    // Without this, Next.js 14 caches every Supabase GET indefinitely and
    // returns stale data even on routes marked `dynamic = 'force-dynamic'`.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  })
  return cached
}
