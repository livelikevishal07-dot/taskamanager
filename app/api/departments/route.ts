import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createDepartment, listDepartments } from '@/lib/db/departments'
import { fromError, ok, fail } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  lead_name: z.string().trim().max(120).nullable().optional(),
  color: z.string().trim().max(20).default('violet'),
})

export async function GET() {
  try {
    return ok(await listDepartments())
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createSchema.parse(body)
    return ok(await createDepartment(input), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
