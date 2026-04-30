import { NextRequest } from 'next/server'
import { z } from 'zod'

import { createAnnouncement, listAnnouncements } from '@/lib/db/announcements'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const typeEnum = z.enum(['announcement', 'event', 'holiday', 'info'])

const createSchema = z.object({
  title:  z.string().trim().min(1).max(300),
  body:   z.string().trim().max(2000).nullable().optional(),
  type:   typeEnum.optional().default('announcement'),
  pinned: z.boolean().optional().default(false),
})

export async function GET() {
  try {
    return ok(await listAnnouncements())
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createSchema.parse(body)
    return ok(await createAnnouncement(input), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
