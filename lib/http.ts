import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Disables browser, CDN, and intermediate caching of API responses so clients
// always see live data. Without this, browsers apply heuristic caching to GET
// responses that lack a Cache-Control header.
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
}

function withNoCache(init?: ResponseInit): ResponseInit {
  return {
    ...init,
    headers: { ...NO_CACHE_HEADERS, ...(init?.headers as Record<string, string> | undefined) },
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, withNoCache(init))
}

export function fail(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, withNoCache({ status }))
}

export function fromError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(400, 'Validation failed', err.flatten())
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const supabaseError = err as { code?: string; message?: string; details?: unknown }
    if (supabaseError.code === '23505') return fail(409, 'Already exists', supabaseError.message)
    if (supabaseError.code === '23503') return fail(400, 'Invalid reference', supabaseError.message)
    if (supabaseError.code === 'PGRST205') {
      return fail(500, 'Database table is missing. Apply the Supabase migrations.', supabaseError.message)
    }
    return fail(500, supabaseError.message ?? 'Unknown error', supabaseError.details)
  }
  if (err instanceof Error) {
    // Supabase errors expose a `code`/`message` on Error subclasses
    const code = (err as { code?: string }).code
    if (code === '23505') return fail(409, 'Already exists', err.message)
    if (code === '23503') return fail(400, 'Invalid reference', err.message)
    return fail(500, err.message)
  }
  return fail(500, 'Unknown error')
}
