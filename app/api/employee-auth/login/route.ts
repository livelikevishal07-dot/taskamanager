import { NextRequest } from 'next/server'

import { findEmployeeByUsername } from '@/lib/db/employees'
import { employeeLoginSchema } from '@/lib/validators/employee'
import { setSessionCookie, verifyPassword } from '@/lib/auth'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { username, password } = employeeLoginSchema.parse(body)

    const employee = await findEmployeeByUsername(username)
    if (!employee || !employee.password) {
      return fail(401, 'Invalid username or password')
    }
    if (!verifyPassword(password, employee.password)) {
      return fail(401, 'Invalid username or password')
    }
    if (employee.status === 'inactive') {
      return fail(403, 'This account is inactive')
    }

    setSessionCookie(employee.id)
    return ok({ id: employee.id, full_name: employee.full_name })
  } catch (err) {
    return fromError(err)
  }
}
