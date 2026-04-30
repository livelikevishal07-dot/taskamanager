import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getLeavePolicy, upsertLeavePolicy } from '@/lib/db/leave-policy'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const upsertSchema = z.object({
  leave_type:      z.enum(['casual','sick','annual','maternity','paternity','unpaid','other']),
  accrual_type:    z.enum(['fixed','monthly']),
  days_per_period: z.number().min(0).max(365),
  max_carryover:   z.number().int().min(0).default(0),
})

export async function GET() {
  try {
    return ok(await getLeavePolicy())
  } catch (err) {
    return fromError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { leave_type, ...rest } = upsertSchema.parse(body)
    return ok(await upsertLeavePolicy(leave_type, rest))
  } catch (err) {
    return fromError(err)
  }
}
