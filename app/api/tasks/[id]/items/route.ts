import { NextRequest } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db/supabase'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createItemSchema = z.object({
  title: z.string().trim().min(1).max(500),
  sort_order: z.number().int().optional().default(0),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createItemSchema.parse(body)

    const { data, error } = await db()
      .from('task_items')
      .insert({ task_id: params.id, title: input.title, sort_order: input.sort_order })
      .select('id, title, completed, sort_order, created_at')
      .single()

    if (error) throw error
    return ok(data, { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
