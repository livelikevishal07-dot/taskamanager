import { NextRequest } from 'next/server'
import { z } from 'zod'

import { deleteTask, getTask, updateTask } from '@/lib/db/tasks'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  deadline: z.string().datetime({ offset: true }).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  completed_at: z.string().datetime({ offset: true }).nullable().optional(),
  employee_ids: z.array(z.string().uuid()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id)
    if (!task) return fail(404, 'Task not found')
    return ok(task)
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = updateSchema.parse(body)
    return ok(await updateTask(params.id, input))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTask(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
