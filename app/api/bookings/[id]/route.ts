import { NextRequest } from 'next/server'
import { z } from 'zod'
import { deleteBooking, updateBooking } from '@/lib/db/bookings'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const WEBSITES  = ['BalloonDekor', '7eventzz', 'Giftlaya'] as const
const PLATFORMS = ['WhatsApp', 'Website', 'Others']        as const

// Admin edit — every field optional, only what's sent gets updated.
const patchSchema = z.object({
  order_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customer_name:    z.string().trim().min(1).max(200).optional(),
  customer_phone:   z.string().trim().min(1).max(30).optional(),
  city:             z.string().trim().min(1).max(100).optional(),
  event_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_amount:     z.number().min(0).optional(),
  advance_paid:     z.number().min(0).optional(),
  website:          z.enum(WEBSITES).optional(),
  occasion:         z.string().trim().min(1).max(100).optional(),
  booking_platform: z.enum(PLATFORMS).optional(),
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
