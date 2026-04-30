import { NextRequest } from 'next/server'
import { z } from 'zod'
import { listHolidays, createHoliday } from '@/lib/db/holidays'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name:      z.string().trim().min(1).max(200),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type:      z.enum(['public', 'company', 'optional']).default('public'),
  recurring: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get('year')
      ? Number(req.nextUrl.searchParams.get('year'))
      : undefined
    return ok(await listHolidays({ year }))
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    return ok(await createHoliday(createSchema.parse(body)), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
