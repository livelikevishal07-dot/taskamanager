import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from '@/lib/db/settings'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  workspace_name: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  week_starts_on: z.enum(['Sunday', 'Monday']).optional(),
  working_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  working_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
})

export async function GET() {
  try {
    return ok(await getWorkspaceSettings())
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    return ok(await updateWorkspaceSettings(updateSchema.parse(body)))
  } catch (err) {
    return fromError(err)
  }
}
