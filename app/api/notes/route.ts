import { NextRequest } from 'next/server'
import { z } from 'zod'
import { listNotes, createNote } from '@/lib/db/notes'
import { fail, fromError, ok } from '@/lib/http'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  employee_id: z.string().uuid(),
  title:       z.string().trim().max(200).nullable().optional(),
  content:     z.string().trim().min(1).max(5000),
  color:       z.string().max(20).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const employeeId = req.nextUrl.searchParams.get('employee_id')
    if (!employeeId) return fail(400, 'employee_id required')
    return ok(await listNotes(employeeId))
  } catch (err) {
    return fromError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return fail(400, 'Invalid JSON body')
    const input = createSchema.parse(body)
    return ok(await createNote(input), { status: 201 })
  } catch (err) {
    return fromError(err)
  }
}
