import 'server-only'

import { db } from './supabase'

export type LeaveType =
  | 'casual'
  | 'sick'
  | 'annual'
  | 'maternity'
  | 'paternity'
  | 'unpaid'
  | 'other'

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  employee_id: string
  type: LeaveType
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: LeaveStatus
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee: {
    id: string
    full_name: string
    email: string
    role: { id: string; name: string; color: string } | null
    department: { id: string; name: string; color: string } | null
  } | null
}

const LEAVE_SELECT =
  '*, employee:employees ( id, full_name, email, role:roles ( id, name, color ), department:departments ( id, name, color ) )'

// ── List ────────────────────────────────────────────────────────────────────

export interface ListLeaveParams {
  employee_id?: string
  status?: LeaveStatus
  type?: LeaveType
  from?: string   // from_date >=
  to?: string     // from_date <=
  limit?: number
}

export async function listLeaveRequests(
  params: ListLeaveParams = {}
): Promise<LeaveRequestWithEmployee[]> {
  let q = db()
    .from('leave_requests')
    .select(LEAVE_SELECT)
    .order('created_at', { ascending: false })

  if (params.employee_id) q = q.eq('employee_id', params.employee_id)
  if (params.status)      q = q.eq('status', params.status)
  if (params.type)        q = q.eq('type', params.type)
  if (params.from)        q = q.gte('from_date', params.from)
  if (params.to)          q = q.lte('from_date', params.to)
  if (params.limit)       q = q.limit(params.limit)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as LeaveRequestWithEmployee[]
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createLeaveRequest(input: {
  employee_id: string
  type: LeaveType
  from_date: string
  to_date: string
  days: number
  reason?: string | null
}): Promise<LeaveRequestWithEmployee> {
  const { data, error } = await db()
    .from('leave_requests')
    .insert(input)
    .select(LEAVE_SELECT)
    .single()
  if (error) throw error
  return data as unknown as LeaveRequestWithEmployee
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateLeaveRequest(
  id: string,
  input: Partial<{
    type: LeaveType
    from_date: string
    to_date: string
    days: number
    reason: string | null
    status: LeaveStatus
    admin_note: string | null
    reviewed_by: string | null
    reviewed_at: string | null
  }>
): Promise<LeaveRequestWithEmployee> {
  const { data, error } = await db()
    .from('leave_requests')
    .update(input)
    .eq('id', id)
    .select(LEAVE_SELECT)
    .single()
  if (error) throw error
  return data as unknown as LeaveRequestWithEmployee
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteLeaveRequest(id: string): Promise<void> {
  const { error } = await db().from('leave_requests').delete().eq('id', id)
  if (error) throw error
}

// ── Stats ───────────────────────────────────────────────────────────────────

export interface LeaveStats {
  pending: number
  approved: number
  rejected: number
  cancelled: number
  totalDaysApproved: number
}

export function deriveLeaveStats(rows: LeaveRequest[]): LeaveStats {
  let pending = 0, approved = 0, rejected = 0, cancelled = 0, totalDaysApproved = 0
  for (const r of rows) {
    if (r.status === 'pending')   pending++
    else if (r.status === 'approved')  { approved++; totalDaysApproved += r.days }
    else if (r.status === 'rejected')  rejected++
    else if (r.status === 'cancelled') cancelled++
  }
  return { pending, approved, rejected, cancelled, totalDaysApproved }
}
