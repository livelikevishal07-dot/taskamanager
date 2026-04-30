import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  deleteAttendance,
  updateAttendance,
} from '@/lib/db/attendance'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  login_at: z.string().datetime().nullable().optional(),
  logout_at: z.string().datetime().nullable().optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'leave', 'holiday']).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    return ok(await updateAttendance(params.id, updateSchema.parse(body)))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteAttendance(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
