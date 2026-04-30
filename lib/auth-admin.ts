import 'server-only'

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

// ── Constants ─────────────────────────────────────────────────────────────────

export const ADMIN_COOKIE   = 'officely_admin_session'
export const SESSION_TTL    = 60 * 60 * 8          // 8 hours
export const SESSION_SEP    = '.'

// ── Secret ────────────────────────────────────────────────────────────────────

function secret(): string {
  const s = process.env.ADMIN_AUTH_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!s) throw new Error('Missing ADMIN_AUTH_SECRET env variable')
  return s
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

function hmac(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Hash a credential value for timing-safe comparison (returns 64-char hex). */
function hashCred(value: string): Buffer {
  return Buffer.from(
    createHmac('sha256', secret()).update(value).digest('hex'),
  )
}

// ── Session sign / verify ─────────────────────────────────────────────────────

/** Produces a signed token: `admin.<exp>.<hmac>` */
export function signAdminSession(): string {
  const exp     = Math.floor(Date.now() / 1000) + SESSION_TTL
  const payload = `admin${SESSION_SEP}${exp}`
  return `${payload}${SESSION_SEP}${hmac(payload)}`
}

/** Returns true iff the token is structurally valid, unexpired, and HMAC-correct. */
export function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split(SESSION_SEP)
    if (parts.length !== 3) return false
    const [role, expStr, sig] = parts
    if (role !== 'admin') return false

    const exp = Number(expStr)
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false

    const expected = hmac(`${role}${SESSION_SEP}${expStr}`)
    const a = Buffer.from(sig,      'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setAdminSessionCookie() {
  cookies().set({
    name:     ADMIN_COOKIE,
    value:    signAdminSession(),
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',          // stricter than employee (lax) — admin only ever navigates from admin pages
    path:     '/',
    maxAge:   SESSION_TTL,
  })
}

export function clearAdminSessionCookie() {
  cookies().set({
    name:     ADMIN_COOKIE,
    value:    '',
    httpOnly: true,
    sameSite: 'strict',
    path:     '/',
    maxAge:   0,
  })
}

/** Server-component check: returns true if the request carries a valid admin session. */
export function isAdminAuthenticated(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// ── Credential verification ───────────────────────────────────────────────────

/**
 * Verify submitted credentials against env-var stored values.
 * Both username and password are HMAC-hashed before comparison so:
 *  - Lengths don't need to match (timingSafeEqual needs equal-length buffers).
 *  - Even a wrong username still runs the full password comparison path
 *    (prevents timing oracle that reveals which field was wrong).
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const storedUser = process.env.ADMIN_USERNAME ?? ''
  const storedPass = process.env.ADMIN_PASSWORD ?? ''

  // Always compute both hashes — never short-circuit
  const userMatch = timingSafeEqual(hashCred(username),   hashCred(storedUser))
  const passMatch = timingSafeEqual(hashCred(password),   hashCred(storedPass))

  return userMatch && passMatch
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Best-effort in-memory limiter. Resets on cold start but protects against
// rapid automated attacks within a single function invocation lifetime.

const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000   // 15 minutes

interface Bucket { count: number; resetAt: number }
const _buckets = new Map<string, Bucket>()

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const bucket = _buckets.get(ip)

  if (!bucket || bucket.resetAt < now) {
    _buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }

  bucket.count++

  if (bucket.count > MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
    return { allowed: false, retryAfterSec }
  }

  return { allowed: true, retryAfterSec: 0 }
}

/** Call after a successful login to clear the rate-limit bucket for that IP. */
export function resetLoginRateLimit(ip: string) {
  _buckets.delete(ip)
}
