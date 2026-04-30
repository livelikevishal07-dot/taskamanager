import { NextRequest } from 'next/server'

import { listEmployees, createEmployee } from '@/lib/db/employees'
import type { EmployeeStatus } from '@/lib/db/types'
import { createEmployeeSchema } from '@/lib/validators/employee'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const result = await listEmployees({
      search: sp.get('search') ?? undefined,
      department_id: sp.get('department_id') ?? undefined,
      role_id: sp.get('role_id') ?? undefined,
      status: (sp.get('status') as EmployeeStatus | null) ?? undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      offset: sp.get('offset') ? Number(sp.get('offset')) : undefined,
    })
    return ok(result)
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createEmployeeSchema.parse(body)
    const employee = await createEmployee(input)
    return ok(employee, { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
