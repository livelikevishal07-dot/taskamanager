import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  deleteDepartment,
  getDepartment,
  updateDepartment,
} from '@/lib/db/departments'
import { fromError, ok, fail } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  lead_name: z.string().trim().max(120).nullable().optional(),
  color: z.string().trim().max(20).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const department = await getDepartment(params.id)
    if (!department) return fail(404, 'Department not found')
    return ok(department)
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = updateSchema.parse(body)
    return ok(await updateDepartment(params.id, input))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteDepartment(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
