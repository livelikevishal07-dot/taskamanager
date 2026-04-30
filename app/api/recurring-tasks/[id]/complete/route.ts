import { NextRequest } from 'next/server'
import { z } from 'zod'

import { markRecurringTaskDone, unmarkRecurringTaskDone } from '@/lib/db/recurring-tasks'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return fail(400, parsed.error.message)
    await markRecurringTaskDone(params.id, parsed.data.employee_id, parsed.data.date)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return fail(400, parsed.error.message)
    await unmarkRecurringTaskDone(params.id, parsed.data.employee_id, parsed.data.date)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
