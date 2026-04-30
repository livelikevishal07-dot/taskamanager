import { NextRequest } from 'next/server'
import { z } from 'zod'
import { updateNote, deleteNote } from '@/lib/db/notes'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  employee_id: z.string().uuid(),
  title:       z.string().trim().max(200).nullable().optional(),
  content:     z.string().trim().min(1).max(5000).optional(),
  color:       z.string().max(20).optional(),
})

const deleteSchema = z.object({
  employee_id: z.string().uuid(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { employee_id, ...patch } = patchSchema.parse(body)
    if (Object.keys(patch).length === 0) return fail(400, 'No fields to update')
    return ok(await updateNote(params.id, employee_id, patch))
  } catch (err) {
    return fromError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const { employee_id } = deleteSchema.parse(body)
    await deleteNote(params.id, employee_id)
    return ok({ deleted: true })
  } catch (err) {
    return fromError(err)
  }
}
