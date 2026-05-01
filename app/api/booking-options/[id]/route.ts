import { NextRequest } from 'next/server'
import { deleteBookingOption } from '@/lib/db/booking-options'
import { ok, fromError } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await deleteBookingOption(params.id)
    return ok({ success: true })
  } catch (err) {
    return fromError(err)
  }
}
