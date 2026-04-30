import { NextRequest } from 'next/server'
import { deleteLeavePolicy } from '@/lib/db/leave-policy'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['casual','sick','annual','maternity','paternity','unpaid','other'] as const

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { leave_type: string } }
) {
  try {
    const { leave_type } = params
    if (!VALID_TYPES.includes(leave_type as any)) {
      return fail(400, `Invalid leave_type: ${leave_type}`)
    }
    await deleteLeavePolicy(leave_type as typeof VALID_TYPES[number])
    return ok({ success: true })
  } catch (err) {
    return fromError(err)
  }
}
