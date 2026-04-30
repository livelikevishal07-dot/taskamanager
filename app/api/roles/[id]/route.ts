import { NextRequest } from 'next/server'
import { z } from 'zod'

import { deleteRole, getRole, updateRole } from '@/lib/db/roles'
import { fromError, ok, fail } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color: z.string().trim().max(20).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await getRole(params.id)
    if (!role) return fail(404, 'Role not found')
    return ok(role)
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = updateSchema.parse(body)
    return ok(await updateRole(params.id, input))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteRole(params.id)
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
