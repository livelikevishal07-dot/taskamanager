import { NextRequest } from 'next/server'
import { z } from 'zod'

import {
  listNotificationSettings,
  updateNotificationSettings,
} from '@/lib/db/settings'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  settings: z.array(
    z.object({
      event_key: z.string().trim().min(1),
      email_enabled: z.boolean(),
      app_enabled: z.boolean(),
    })
  ),
})

export async function GET() {
  try {
    return ok(await listNotificationSettings())
  } catch (err) {
    return fromError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = updateSchema.parse(body)
    return ok(await updateNotificationSettings(input.settings))
  } catch (err) {
    return fromError(err)
  }
}
