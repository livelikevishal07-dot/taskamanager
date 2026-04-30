import { NextRequest } from 'next/server'
import { z } from 'zod'
import { updateHoliday, deleteHoliday } from '@/lib/db/holidays'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name:      z.string().trim().min(1).max(200).optional(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type:      z.enum(['public', 'company', 'optional']).optional(),
  recurring: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    return ok(await updateHoliday(params.id, patchSchema.parse(body)))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteHoliday(params.id)
    return ok({ success: true })
  } catch (err) {
    return fromError(err)
  }
}
