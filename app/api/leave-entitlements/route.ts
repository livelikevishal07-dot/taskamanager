import { NextRequest } from 'next/server'
import { getLeaveBalances } from '@/lib/db/leave-entitlements'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp         = req.nextUrl.searchParams
    const employeeId = sp.get('employee_id')
    const year       = sp.get('year') ? Number(sp.get('year')) : undefined

    if (!employeeId) return fail(400, 'employee_id is required')
    return ok(await getLeaveBalances(employeeId, year))
  } catch (err) {
    return fromError(err)
  }
}
