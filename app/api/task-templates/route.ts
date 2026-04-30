import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createTemplate, listTemplates } from '@/lib/db/task-templates'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  company_id: z.string().uuid().nullable().optional(),
  employee_ids: z.array(z.string().uuid()).optional(),
})

export async function GET() {
  try {
    return ok(await listTemplates())
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createSchema.parse(body)
    return ok(await createTemplate(input), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
