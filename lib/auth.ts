import 'server-only'

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'officely_employee_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secret(): string {
  const s =
    process.env.EMPLOYEE_AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  if (!s) {
    throw new Error(
      'Missing EMPLOYEE_AUTH_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback)'
    )
  }
  return s
}

/**
 * Plain-text password comparison. Per product decision, employee passwords
 * are stored as plain text so admins can see and reset them directly. Use
 * timingSafeEqual to avoid character-by-character timing leaks.
 */
export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!plain || !stored) return false
  const a = Buffer.from(plain, 'utf8')
  const b = Buffer.from(stored, 'utf8')
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function sign(payload: string): string {
  return createHmac('sha256', secret())
    .update(payload)
    .digest('base64url')
}

export function signSession(employeeId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${employeeId}.${exp}`
  return `${payload}.${sign(payload)}`
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [employeeId, expStr, sig] = parts
  const payload = `${employeeId}.${expStr}`
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null
  return employeeId
}

export function setSessionCookie(employeeId: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: signSession(employeeId),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie() {
  cookies().set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export function getSessionEmployeeId(): string | null {
  const token = cookies().get(COOKIE_NAME)?.value
  return verifySession(token)
}
