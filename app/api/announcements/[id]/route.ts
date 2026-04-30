import { NextRequest } from 'next/server'
import { z } from 'zod'

import { deleteAnnouncement, updateAnnouncement } from '@/lib/db/announcements'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const typeEnum = z.enum(['announcement', 'event', 'holiday', 'info'])

const patchSchema = z.object({
  title:  z.string().trim().min(1).max(300).optional(),
  body:   z.string().trim().max(2000).nullable().optional(),
  type:   typeEnum.optional(),
  pinned: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = patchSchema.parse(body)
    if (Object.keys(input).length === 0) return fail(400, 'Nothing to update')
    return ok(await updateAnnouncement(params.id, input))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteAnnouncement(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
