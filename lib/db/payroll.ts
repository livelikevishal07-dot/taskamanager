import 'server-only'

import { db } from './supabase'
import type { Payslip } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Total days in a given month (1-based) */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Count Sundays (weekday 0) in a given month */
function sundaysInMonth(year: number, month: number): number {
  const total = daysInMonth(year, month)
  let count = 0
  for (let d = 1; d <= total; d++) {
    if (new Date(year, month - 1, d).getDay() === 0) count++
  }
  return count
}

/** Working days = calendar days minus Sundays */
function workingDaysInMonth(year: number, month: number): number {
  return daysInMonth(year, month) - sundaysInMonth(year, month)
}

/** Round to 2 decimal places */
function r2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Payslip select ────────────────────────────────────────────────────────────

const PAYSLIP_SELECT =
  '*, employee:employees ( id, full_name, email, department:departments ( id, name, color ) )'

// ── List ──────────────────────────────────────────────────────────────────────

export interface ListPayslipsParams {
  employee_id?: string
  month?: number
  year?: number
  status?: 'draft' | 'published'
}

export async function listPayslips(
  params: ListPayslipsParams = {}
): Promise<Payslip[]> {
  let q = db()
    .from('payslips')
    .select(PAYSLIP_SELECT)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (params.employee_id) q = q.eq('employee_id', params.employee_id)
  if (params.month) q = q.eq('month', params.month)
  if (params.year) q = q.eq('year', params.year)
  if (params.status) q = q.eq('status', params.status)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as Payslip[]
}

export async function getPayslip(id: string): Promise<Payslip | null> {
  const { data, error } = await db()
    .from('payslips')
    .select(PAYSLIP_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Payslip | null
}

export async function getPayslipByEmployeeMonth(
  employeeId: string,
  month: number,
  year: number
): Promise<Payslip | null> {
  const { data, error } = await db()
    .from('payslips')
    .select(PAYSLIP_SELECT)
    .eq('employee_id', employeeId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Payslip | null
}

// ── Generate / upsert payslip ─────────────────────────────────────────────────

export interface GeneratePayslipInput {
  employee_id: string
  month: number
  year: number
}

/**
 * Fetch the employee's salary, attendance data for the month, and compute
 * all payslip fields. Upserts the payslip row (draft status).
 */
export async function generatePayslip(input: GeneratePayslipInput): Promise<Payslip> {
  const { employee_id, month, year } = input

  // Fetch employee (need salary + company)
  const { data: emp, error: empErr } = await db()
    .from('employees')
    .select('id, full_name, monthly_salary, company_id, company:companies ( id, name )')
    .eq('id', employee_id)
    .single()
  if (empErr) throw empErr
  if (!emp) throw new Error('Employee not found')

  const monthlySalary: number = Number(emp.monthly_salary) || 0
  const companyName: string = (emp.company as { name?: string } | null)?.name ?? ''

  // Date range for the month
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month, 0).toISOString().slice(0, 10) // last day

  // Fetch attendance records for this employee in this month
  const { data: attRows, error: attErr } = await db()
    .from('attendance_sessions')
    .select('date, status')
    .eq('employee_id', employee_id)
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (attErr) throw attErr

  // Also fetch approved leave requests that overlap this month
  // NOTE: the table uses from_date / to_date (not start_date / end_date)
  const { data: leaveRows, error: leaveErr } = await db()
    .from('leave_requests')
    .select('from_date, to_date, status, type')
    .eq('employee_id', employee_id)
    .eq('status', 'approved')
    .lte('from_date', lastDay)
    .gte('to_date', firstDay)

  if (leaveErr) throw leaveErr

  // Build separate sets for regular (paid) vs emergency (unpaid/deductible) leave
  const approvedLeaveDates   = new Set<string>() // paid leave dates
  const emergencyLeaveDates  = new Set<string>() // emergency (deductible) leave dates

  for (const lr of leaveRows ?? []) {
    const start = new Date(lr.from_date)
    const end   = new Date(lr.to_date)
    const isEmergency = lr.type === 'emergency'

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Only non-Sundays count
      if (d.getDay() !== 0) {
        const dateStr = d.toISOString().slice(0, 10)
        if (isEmergency) {
          emergencyLeaveDates.add(dateStr)
        } else {
          approvedLeaveDates.add(dateStr)
        }
      }
    }
  }

  // Count attendance statuses
  let presentDays  = 0
  let absentDays   = 0
  let paidLeaveDays = 0

  const attendedDates = new Set<string>()
  for (const row of attRows ?? []) {
    const dow = new Date(row.date).getDay()
    if (dow === 0) continue // skip Sundays
    attendedDates.add(row.date)

    if (['present', 'late', 'half_day'].includes(row.status)) {
      presentDays++
    } else if (row.status === 'leave') {
      // attendance marked as leave — treat as paid leave
      paidLeaveDays++
    } else if (row.status === 'absent') {
      // absent — check if covered by an approved leave request
      if (approvedLeaveDates.has(row.date)) {
        paidLeaveDays++
      } else {
        absentDays++
      }
    }
  }

  // Any approved leave date not in attendance records counts as paid leave
  for (const ld of approvedLeaveDates) {
    if (!attendedDates.has(ld)) {
      paidLeaveDays++
    }
  }

  // Count approved emergency leave days that fall within this month
  const emergencyLeaveDaysInMonth = emergencyLeaveDates.size

  const totalWorkingDays = workingDaysInMonth(year, month)

  // Salary computation
  const perDaySalary       = monthlySalary > 0 ? r2(monthlySalary / totalWorkingDays) : 0
  const basePay            = r2(monthlySalary * 0.60)
  const da                 = r2(monthlySalary * 0.25)
  const travelAllow        = r2(monthlySalary * 0.15)
  const grossSalary        = monthlySalary
  const deduction          = r2(absentDays * perDaySalary)
  const emergencyDeduction = r2(emergencyLeaveDaysInMonth * perDaySalary)
  const netSalary          = r2(grossSalary - deduction - emergencyDeduction)

  const upsertData = {
    employee_id,
    month,
    year,
    monthly_salary:       monthlySalary,
    company_name:         companyName,
    total_working_days:   totalWorkingDays,
    present_days:         presentDays,
    paid_leave_days:      paidLeaveDays,
    absent_days:          absentDays,
    per_day_salary:       perDaySalary,
    base_pay:             basePay,
    da,
    travel_allowance:     travelAllow,
    gross_salary:         grossSalary,
    deduction,
    emergency_leave_days: emergencyLeaveDaysInMonth,
    emergency_deduction:  emergencyDeduction,
    net_salary:           netSalary,
    status:               'draft' as const,
  }

  const { data, error } = await db()
    .from('payslips')
    .upsert(upsertData, { onConflict: 'employee_id,month,year' })
    .select(PAYSLIP_SELECT)
    .single()

  if (error) throw error
  return data as unknown as Payslip
}

// ── Update (admin override / publish) ─────────────────────────────────────────

export interface UpdatePayslipInput {
  override_net_salary?: number | null
  admin_note?: string | null
  status?: 'draft' | 'published'
  // Allow overriding individual components too
  present_days?: number
  absent_days?: number
  paid_leave_days?: number
}

export async function updatePayslip(
  id: string,
  input: UpdatePayslipInput
): Promise<Payslip> {
  // Fetch current payslip to recompute if attendance fields changed
  const current = await getPayslip(id)
  if (!current) throw new Error('Payslip not found')

  const updates: Record<string, unknown> = {}

  if ('override_net_salary' in input) updates.override_net_salary = input.override_net_salary
  if ('admin_note'         in input) updates.admin_note          = input.admin_note
  if ('status'             in input) updates.status              = input.status

  // If attendance days are overridden, recompute deduction and net
  const presentDays  = input.present_days   ?? current.present_days
  const absentDays   = input.absent_days    ?? current.absent_days
  const paidLeave    = input.paid_leave_days ?? current.paid_leave_days

  if ('present_days' in input || 'absent_days' in input || 'paid_leave_days' in input) {
    updates.present_days    = presentDays
    updates.absent_days     = absentDays
    updates.paid_leave_days = paidLeave
    const deduction          = r2(absentDays * current.per_day_salary)
    const emergencyDeduction = r2((current.emergency_leave_days ?? 0) * current.per_day_salary)
    const netSalary          = r2(current.gross_salary - deduction - emergencyDeduction)
    updates.deduction  = deduction
    updates.net_salary = netSalary
  }

  const { data, error } = await db()
    .from('payslips')
    .update(updates)
    .eq('id', id)
    .select(PAYSLIP_SELECT)
    .single()

  if (error) throw error
  return data as unknown as Payslip
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deletePayslip(id: string): Promise<void> {
  const { error } = await db().from('payslips').delete().eq('id', id)
  if (error) throw error
}
