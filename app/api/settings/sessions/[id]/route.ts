import { NextRequest } from 'next/server'

import { deleteAdminSession } from '@/lib/db/settings'
import { fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteAdminSession(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
