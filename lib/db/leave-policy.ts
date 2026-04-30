import 'server-only'
import { db } from './supabase'

export type LeaveType   = 'casual' | 'sick' | 'annual' | 'maternity' | 'paternity' | 'unpaid' | 'other'
export type AccrualType = 'fixed' | 'monthly'

export interface LeavePolicy {
  id:              string
  leave_type:      LeaveType
  accrual_type:    AccrualType
  days_per_period: number
  max_carryover:   number
  created_at:      string
  updated_at:      string
}

const LEAVE_ORDER: LeaveType[] = ['sick','casual','annual','maternity','paternity','unpaid','other']

export async function getLeavePolicy(): Promise<LeavePolicy[]> {
  const { data, error } = await db()
    .from('leave_policy')
    .select('*')
  if (error) throw error
  const rows = (data ?? []) as LeavePolicy[]
  // Return in a predictable order
  return LEAVE_ORDER.map((lt) => rows.find((r) => r.leave_type === lt)).filter(Boolean) as LeavePolicy[]
}

export async function upsertLeavePolicy(
  leave_type: LeaveType,
  input: { accrual_type: AccrualType; days_per_period: number; max_carryover?: number }
): Promise<LeavePolicy> {
  const { data, error } = await db()
    .from('leave_policy')
    .upsert({ leave_type, ...input }, { onConflict: 'leave_type' })
    .select()
    .single()
  if (error) throw error
  return data as LeavePolicy
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteLeavePolicy(leave_type: LeaveType): Promise<void> {
  const { error } = await db()
    .from('leave_policy')
    .delete()
    .eq('leave_type', leave_type)
  if (error) throw error
}

// ── Helper: compute effective days for a given policy + current date ──────────

export function computeEffectiveDays(policy: LeavePolicy, asOf = new Date()): number {
  if (policy.accrual_type === 'monthly') {
    // 1 day per month accrues at the start of each month
    const monthsElapsed = asOf.getMonth() + 1  // Jan=1, Dec=12
    return Math.round(monthsElapsed * policy.days_per_period * 10) / 10
  }
  // fixed = flat annual entitlement
  return policy.days_per_period
}
