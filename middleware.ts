import { type NextRequest, NextResponse } from 'next/server'

// Inlined here to avoid pulling node:crypto into the Edge runtime bundle.
// Keep in sync with lib/auth-admin.ts.
const ADMIN_COOKIE = 'officely_admin_session'
const SESSION_SEP  = '.'

// ── Edge-compatible HMAC verify ───────────────────────────────────────────────
// Mirrors verifyAdminToken() from lib/auth-admin.ts but uses the Web Crypto
// API (available in the Edge runtime) instead of Node's crypto module.

async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const parts = token.split(SESSION_SEP)
    if (parts.length !== 3) return false
    const [role, expStr, sig] = parts

    if (role !== 'admin') return false

    const exp = Number(expStr)
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false

    const secretVal =
      process.env.ADMIN_AUTH_SECRET ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      ''
    if (!secretVal) return false

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretVal),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const payload    = enc.encode(`${role}${SESSION_SEP}${expStr}`)
    const sigBuf     = await crypto.subtle.sign('HMAC', key, payload)
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') // base64url

    // Constant-time compare (character-level XOR)
    if (sig.length !== expectedB64.length) return false
    let diff = 0
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedB64.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

// ── Route matcher ─────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard CMS UI — the login page itself is exempt
  const isAdminRoute = pathname === '/cms' || pathname.startsWith('/cms/')
  if (!isAdminRoute) return NextResponse.next()

  const token = req.cookies.get(ADMIN_COOKIE)?.value

  if (!token || !(await verifyTokenEdge(token))) {
    // Preserve the originally requested path so the login form can redirect back
    const loginUrl    = req.nextUrl.clone()
    loginUrl.pathname = '/admin-login'
    loginUrl.search   = `?from=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Match /cms and every sub-path; skip /admin-login (separate path segment)
export const config = {
  matcher: ['/cms', '/cms/:path*'],
}
