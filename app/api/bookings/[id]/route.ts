import { NextRequest } from 'next/server'
import { z } from 'zod'
import { deleteBooking, updateBooking } from '@/lib/db/bookings'
import { getBookingOptions } from '@/lib/db/booking-options'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Admin edit — every field optional, only what's sent gets updated.
const patchSchema = z.object({
  order_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customer_name:    z.string().trim().min(1).max(200).optional(),
  customer_phone:   z.string().trim().min(1).max(30).optional(),
  city:             z.string().trim().min(1).max(100).optional(),
  event_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_amount:     z.number().min(0).optional(),
  advance_paid:     z.number().min(0).optional(),
  website:          z.string().trim().min(1).max(100).optional(),
  occasion:         z.string().trim().min(1).max(100).optional(),
  booking_platform: z.string().trim().min(1).max(100).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const parsed = patchSchema.parse(body)
    if (Object.keys(parsed).length === 0) return fail(400, 'No fields to update')

    if (parsed.website || parsed.booking_platform) {
      const options = await getBookingOptions()
      if (parsed.website) {
        const websites = new Set(options.filter((o) => o.type === 'website').map((o) => o.label))
        if (!websites.has(parsed.website)) return fail(400, `Unknown website "${parsed.website}"`)
      }
      if (parsed.booking_platform) {
        const platforms = new Set(options.filter((o) => o.type === 'platform').map((o) => o.label))
        if (!platforms.has(parsed.booking_platform)) return fail(400, `Unknown platform "${parsed.booking_platform}"`)
      }
    }

    return ok(await updateBooking(params.id, parsed))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const employee_id = body?.employee_id
    if (!employee_id) return fail(400, 'employee_id required')
    await deleteBooking(params.id, employee_id)
    return ok({ success: true })
  } catch (err) {
    return fromError(err)
  }
}
