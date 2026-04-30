import { NextRequest } from 'next/server'
import { z } from 'zod'

import { updateLeaveRequest, deleteLeaveRequest } from '@/lib/db/leave-requests'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  type: z.enum(['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other']).optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.number().int().min(1).optional(),
  reason: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  admin_note: z.string().trim().max(2000).nullable().optional(),
  reviewed_by: z.string().trim().max(200).nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
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
    return ok(await updateLeaveRequest(params.id, input))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteLeaveRequest(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
