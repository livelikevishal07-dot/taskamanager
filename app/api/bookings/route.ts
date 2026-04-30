import { NextRequest } from 'next/server'
import { z } from 'zod'
import { listBookings, createBooking } from '@/lib/db/bookings'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const WEBSITES  = ['BalloonDekor', '7eventzz', 'Giftlaya'] as const
const PLATFORMS = ['WhatsApp', 'Website', 'Others'] as const

const createSchema = z.object({
  employee_id:      z.string().uuid(),
  order_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customer_name:    z.string().trim().min(1).max(200),
  customer_phone:   z.string().trim().min(1).max(30),
  city:             z.string().trim().min(1).max(100),
  event_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount:     z.number().min(0),
  advance_paid:     z.number().min(0),
  website:          z.enum(WEBSITES),
  occasion:         z.string().trim().min(1).max(100),
  booking_platform: z.enum(PLATFORMS),
})

export async function GET(req: NextRequest) {
  try {
    const sp          = req.nextUrl.searchParams
    const employee_id = sp.get('employee_id') ?? undefined
    const from        = sp.get('from') ?? undefined
    const to          = sp.get('to') ?? undefined
    const limit       = sp.get('limit') ? Number(sp.get('limit')) : undefined
    const withEmployee = sp.get('with_employee') === '1'
    return ok(await listBookings({ employee_id, from, to, limit, withEmployee }))
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = createSchema.parse(body)
    return ok(await createBooking(parsed), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
