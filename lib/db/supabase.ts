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
    // Do NOT override fetch cache here — allow Next.js to deduplicate identical
    // GET requests within a single server render pass. Routes that must be
    // completely fresh (all API routes) already use `export const dynamic =
    // 'force-dynamic'`, which bypasses response caching at the route level.
  })
  return cached
}
