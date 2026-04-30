import { NextRequest } from 'next/server'
import { z } from 'zod'

import { upsertAttendanceBulk } from '@/lib/db/attendance'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const recordSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  login_at: z.string().datetime().nullable().optional(),
  logout_at: z.string().datetime().nullable().optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'leave', 'holiday']),
  notes: z.string().trim().max(500).nullable().optional(),
})

const bulkSchema = z.object({
  records: z.array(recordSchema).min(1).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { records } = bulkSchema.parse(body)
    const saved = await upsertAttendanceBulk(records)
    return ok(saved, { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
