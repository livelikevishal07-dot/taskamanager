import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getBookingOptions, createBookingOption } from '@/lib/db/booking-options'
import { ok, fail, fromError } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  type:  z.enum(['website', 'platform']),
  label: z.string().min(1).max(100),
})

export async function GET() {
  try {
    return ok(await getBookingOptions())
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { type, label } = createSchema.parse(body)
    return ok(await createBookingOption(type, label))
  } catch (err) {
    return fromError(err)
  }
}
