import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayslip, updatePayslip, deletePayslip } from '@/lib/db/payroll'

const updateSchema = z.object({
  override_net_salary: z.number().nonnegative().nullable().optional(),
  admin_note:          z.string().max(2000).nullable().optional(),
  status:              z.enum(['draft', 'published']).optional(),
  present_days:        z.number().int().min(0).optional(),
  absent_days:         z.number().int().min(0).optional(),
  paid_leave_days:     z.number().int().min(0).optional(),
})

// GET /api/payroll/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payslip = await getPayslip(params.id)
    if (!payslip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(payslip)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH /api/payroll/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const input = updateSchema.parse(body)
    const payslip = await updatePayslip(params.id, input)
    return NextResponse.json(payslip)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.flatten() }, { status: 422 })
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE /api/payroll/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePayslip(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
