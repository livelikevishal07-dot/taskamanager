import { clearSessionCookie } from '@/lib/auth'
import { ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST() {
  clearSessionCookie()
  return ok({ ok: true })
}
