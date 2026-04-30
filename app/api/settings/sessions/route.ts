import { NextRequest } from 'next/server'

import {
  deleteOtherAdminSessions,
  listAdminSessions,
} from '@/lib/db/settings'
import { fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return ok(await listAdminSessions())
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    await deleteOtherAdminSessions()
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
