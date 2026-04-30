import 'server-only'
import { db } from './supabase'
import { getLeavePolicy, computeEffectiveDays, type LeaveType } from './leave-policy'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LeaveBalance {
  leave_type:   LeaveType
  total_days:   number
  used_days:    number
  pending_days: number
  remaining:    number
  accrual_type: 'fixed' | 'monthly'
}

// ── Main query ─────────────────────────────────────────────────────────────────

export async function getLeaveBalances(
  employeeId: string,
  year?: number
): Promise<LeaveBalance[]> {
  const y     = year ?? new Date().getFullYear()
  const asOf  = new Date()

  // 1. Pull company-wide leave policy — only types that exist here are shown
  const policies = await getLeavePolicy()

  // 2. Pull approved / pending requests for this employee this year
  const yearStart = `${y}-01-01`
  const yearEnd   = `${y}-12-31`

  const { data: reqs, error: rErr } = await db()
    .from('leave_requests')
    .select('type, days, status')
    .eq('employee_id', employeeId)
    .gte('from_date', yearStart)
    .lte('from_date', yearEnd)

  if (rErr) throw rErr

  // Tally used (approved) and pending per type
  const usedMap    = new Map<LeaveType, number>()
  const pendingMap = new Map<LeaveType, number>()

  for (const r of reqs ?? []) {
    const t = r.type as LeaveType
    if (r.status === 'approved') {
      usedMap.set(t, (usedMap.get(t) ?? 0) + r.days)
    } else if (r.status === 'pending') {
      pendingMap.set(t, (pendingMap.get(t) ?? 0) + r.days)
    }
  }

  // 3. Build balance for every policy that exists — fully dynamic, no hardcoded list
  return policies.map((policy) => {
    const lt      = policy.leave_type
    const total   = computeEffectiveDays(policy, asOf)
    const used    = usedMap.get(lt) ?? 0
    const pending = pendingMap.get(lt) ?? 0

    return {
      leave_type:   lt,
      total_days:   total,
      used_days:    used,
      pending_days: pending,
      remaining:    Math.max(0, total - used),
      accrual_type: policy.accrual_type,
    }
  })
}

// ── Upsert a per-employee override (optional future use) ───────────────────────

export interface LeaveEntitlement {
  id: string
  employee_id: string
  leave_type: LeaveType
  total_days: number
  year: number
}

export async function upsertLeaveEntitlement(input: {
  employee_id: string
  leave_type: LeaveType
  total_days: number
  year?: number
}): Promise<LeaveEntitlement> {
  const year = input.year ?? new Date().getFullYear()
  const { data, error } = await db()
    .from('leave_entitlements')
    .upsert({ ...input, year }, { onConflict: 'employee_id,leave_type,year' })
    .select()
    .single()
  if (error) throw error
  return data as LeaveEntitlement
}
