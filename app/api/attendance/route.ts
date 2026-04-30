import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  listAttendance,
  upsertAttendance,
  type AttendanceStatus,
} from '@/lib/db/attendance'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const statusSchema = z.enum(['present', 'late', 'absent', 'half_day', 'leave', 'holiday'])

const writeSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  login_at: z.string().datetime().nullable().optional(),
  logout_at: z.string().datetime().nullable().optional(),
  status: statusSchema,
  notes: z.string().trim().max(500).nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    return ok(
      await listAttendance({
        employee_id: sp.get('employee_id') ?? undefined,
        status: (sp.get('status') as AttendanceStatus | null) ?? undefined,
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
    return ok(await upsertAttendance(writeSchema.parse(body)), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
