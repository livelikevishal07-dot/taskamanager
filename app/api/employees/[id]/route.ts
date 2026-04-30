import { NextRequest } from 'next/server'

import {
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from '@/lib/db/employees'
import { updateEmployeeSchema } from '@/lib/validators/employee'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

interface Ctx {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const employee = await getEmployee(params.id)
    if (!employee) return fail(404, 'Employee not found')
    return ok(employee)
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = updateEmployeeSchema.parse(body)
    const employee = await updateEmployee(params.id, input)
    return ok(employee)
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await deleteEmployee(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
