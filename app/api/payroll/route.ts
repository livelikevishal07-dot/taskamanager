import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { listPayslips, generatePayslip } from '@/lib/db/payroll'

const generateSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
})

// GET /api/payroll?employee_id=&month=&year=&status=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const payslips = await listPayslips({
      employee_id: sp.get('employee_id') ?? undefined,
      month:       sp.get('month') ? Number(sp.get('month'))  : undefined,
      year:        sp.get('year')  ? Number(sp.get('year'))   : undefined,
      status:      (sp.get('status') as 'draft' | 'published') ?? undefined,
    })
    return NextResponse.json(payslips)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/payroll — generate a payslip
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = generateSchema.parse(body)
    const payslip = await generatePayslip(input)
    return NextResponse.json(payslip, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.flatten() }, { status: 422 })
    }
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[payroll generate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
