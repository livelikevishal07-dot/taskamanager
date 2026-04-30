import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createRecurringTask, listRecurringTasks, listRecurringTasksForEmployee } from '@/lib/db/recurring-tasks'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  recurrence: z.enum(['daily', 'weekdays', 'weekly']).optional(),
  active_weekday: z.number().int().min(0).max(6).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  employee_ids: z.array(z.string().uuid()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const employeeId = searchParams.get('employee_id')
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

    if (employeeId) {
      return ok(await listRecurringTasksForEmployee(employeeId, date))
    }
    return ok(await listRecurringTasks())
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return fail(400, parsed.error.message)
    return ok(await createRecurringTask(parsed.data), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
