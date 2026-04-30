import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAdminCredentials,
  setAdminSessionCookie,
  checkLoginRateLimit,
  resetLoginRateLimit,
} from '@/lib/auth-admin'

export const dynamic = 'force-dynamic'

/** Derive a best-effort IP from the request for rate limiting. */
function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = getIP(req)
  const { allowed, retryAfterSec } = checkLoginRateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` },
      {
        status: 429,
        headers: {
          'Retry-After':      String(retryAfterSec),
          'X-RateLimit-Limit': '5',
        },
      },
    )
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' || body === null ||
    typeof (body as Record<string, unknown>).username !== 'string' ||
    typeof (body as Record<string, unknown>).password !== 'string'
  ) {
    return NextResponse.json({ error: 'username and password are required' }, { status: 400 })
  }

  const { username, password } = body as { username: string; password: string }

  // ── Verify credentials ───────────────────────────────────────────────────
  const valid = verifyAdminCredentials(username.trim(), password)

  if (!valid) {
    // Deliberate vague error — don't reveal which field was wrong
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    )
  }

  // ── Issue session ────────────────────────────────────────────────────────
  resetLoginRateLimit(ip)   // clear bucket on success
  setAdminSessionCookie()

  return NextResponse.json({ ok: true })
}
