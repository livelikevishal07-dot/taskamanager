import { NextRequest } from 'next/server'
import { z } from 'zod'

import { deleteRecurringTask, updateRecurringTask } from '@/lib/db/recurring-tasks'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  recurrence: z.enum(['daily', 'weekdays', 'weekly']).optional(),
  active_weekday: z.number().int().min(0).max(6).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  employee_ids: z.array(z.string().uuid()).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return fail(400, parsed.error.message)
    return ok(await updateRecurringTask(params.id, parsed.data))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteRecurringTask(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
