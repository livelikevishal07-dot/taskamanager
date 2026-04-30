import { NextRequest } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db/supabase'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createCommentSchema = z.object({
  author_name: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await db()
      .from('task_comments')
      .select('id, task_id, author_name, content, created_at')
      .eq('task_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return ok(data ?? [])
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createCommentSchema.parse(body)

    const { data, error } = await db()
      .from('task_comments')
      .insert({ task_id: params.id, author_name: input.author_name, content: input.content })
      .select('id, task_id, author_name, content, created_at')
      .single()

    if (error) throw error
    return ok(data, { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
