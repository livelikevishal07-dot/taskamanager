import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createBooking } from '@/lib/db/bookings'
import { getBookingOptions } from '@/lib/db/booking-options'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const API_TOKEN = 'giftlaya@91'

const createSchema = z.object({
  employee_id:      z.string().uuid(),
  order_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customer_name:    z.string().trim().min(1).max(200),
  customer_phone:   z.string().trim().min(1).max(30),
  city:             z.string().trim().min(1).max(100),
  event_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount:     z.number().min(0),
  advance_paid:     z.number().min(0),
  website:          z.string().trim().min(1).max(100),
  occasion:         z.string().trim().min(1).max(100),
  booking_platform: z.string().trim().min(1).max(100),
})

function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  if (!header.toLowerCase().startsWith('bearer ')) return false
  const token = header.slice(7).trim()
  // Constant-time compare to avoid timing leaks
  if (token.length !== API_TOKEN.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ API_TOKEN.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAuth(req)) return fail(401, 'Unauthorized')

    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = createSchema.parse(body)

    const options   = await getBookingOptions()
    const websites  = new Set(options.filter((o) => o.type === 'website').map((o) => o.label))
    const platforms = new Set(options.filter((o) => o.type === 'platform').map((o) => o.label))
    if (!websites.has(parsed.website))           return fail(400, `Unknown website "${parsed.website}"`)
    if (!platforms.has(parsed.booking_platform)) return fail(400, `Unknown platform "${parsed.booking_platform}"`)

    return ok(await createBooking(parsed), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
