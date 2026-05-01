import { NextRequest } from 'next/server'
import { z } from 'zod'

import { listLeaveRequests, createLeaveRequest } from '@/lib/db/leave-requests'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other', 'emergency']),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().min(1),
  reason: z.string().trim().max(2000).nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    return ok(
      await listLeaveRequests({
        employee_id: sp.get('employee_id') ?? undefined,
        status: (sp.get('status') as never) ?? undefined,
        type: (sp.get('type') as never) ?? undefined,
        from: sp.get('from') ?? undefined,
        to: sp.get('to') ?? undefined,
        limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      })
    )
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createSchema.parse(body)
    return ok(await createLeaveRequest(input), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
