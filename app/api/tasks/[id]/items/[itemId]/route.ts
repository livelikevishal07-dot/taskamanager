import { NextRequest } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db/supabase'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const patchItemSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = patchItemSchema.parse(body)

    if (Object.keys(input).length === 0) return fail(400, 'Nothing to update')

    const { data, error } = await db()
      .from('task_items')
      .update(input)
      .eq('id', params.itemId)
      .eq('task_id', params.id)
      .select('id, title, completed, sort_order')
      .single()

    if (error) throw error
    if (!data) return fail(404, 'Item not found')
    return ok(data)
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { error } = await db()
      .from('task_items')
      .delete()
      .eq('id', params.itemId)
      .eq('task_id', params.id)

    if (error) throw error
    return ok({ ok: true })
  } catch (err) {
    return fromError(err)
  }
}
