import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/lib/auth-admin'

export const dynamic = 'force-dynamic'

export async function POST() {
  clearAdminSessionCookie()
  return NextResponse.json({ ok: true })
}
