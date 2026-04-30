import 'server-only'

import { db } from './supabase'
import type { Employee } from './types'

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'leave'
  | 'holiday'

export interface AttendanceRow {
  id: string
  employee_id: string
  date: string
  login_at: string | null
  logout_at: string | null
  total_minutes: number | null
  status: AttendanceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceWithEmployee extends AttendanceRow {
  employee: Pick<
    Employee,
    | 'id'
    | 'full_name'
    | 'email'
    | 'role'
    | 'department'
    | 'working_hours_start'
    | 'working_hours_end'
    | 'working_days'
  > | null
}

const ATTENDANCE_SELECT =
  '*, employee:employees ( id, full_name, email, working_hours_start, working_hours_end, working_days, role:roles ( id, name, color ), department:departments ( id, name, color ) )'

export interface ListAttendanceParams {
  employee_id?: string
  status?: AttendanceStatus
  from?: string
  to?: string
  limit?: number
}

export async function listAttendance(
  params: ListAttendanceParams = {}
): Promise<AttendanceWithEmployee[]> {
  let q = db()
    .from('attendance_sessions')
    .select(ATTENDANCE_SELECT)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (params.employee_id) q = q.eq('employee_id', params.employee_id)
  if (params.status) q = q.eq('status', params.status)
  if (params.from) q = q.gte('date', params.from)
  if (params.to) q = q.lte('date', params.to)
  if (params.limit) q = q.limit(params.limit)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as AttendanceWithEmployee[]
}

export async function upsertAttendance(input: {
  employee_id: string
  date: string
  login_at?: string | null
  logout_at?: string | null
  status: AttendanceStatus
  notes?: string | null
}): Promise<AttendanceWithEmployee> {
  const { data, error } = await db()
    .from('attendance_sessions')
    .upsert(input, { onConflict: 'employee_id,date' })
    .select(ATTENDANCE_SELECT)
    .single()
  if (error) throw error
  return data as unknown as AttendanceWithEmployee
}

export async function updateAttendance(
  id: string,
  input: Partial<{
    date: string
    login_at: string | null
    logout_at: string | null
    status: AttendanceStatus
    notes: string | null
  }>
): Promise<AttendanceWithEmployee> {
  const { data, error } = await db()
    .from('attendance_sessions')
    .update(input)
    .eq('id', id)
    .select(ATTENDANCE_SELECT)
    .single()
  if (error) throw error
  return data as unknown as AttendanceWithEmployee
}

export async function upsertAttendanceBulk(
  records: Array<{
    employee_id: string
    date: string
    login_at?: string | null
    logout_at?: string | null
    status: AttendanceStatus
    notes?: string | null
  }>
): Promise<AttendanceWithEmployee[]> {
  const { data, error } = await db()
    .from('attendance_sessions')
    .upsert(records, { onConflict: 'employee_id,date' })
    .select(ATTENDANCE_SELECT)
  if (error) throw error
  return (data ?? []) as unknown as AttendanceWithEmployee[]
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await db().from('attendance_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function listAttendanceForEmployee(
  employeeId: string,
  days = 30
): Promise<AttendanceRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  const sinceIso = since.toISOString().slice(0, 10)

  const { data, error } = await db()
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', sinceIso)
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []) as AttendanceRow[]
}

// Re-export pure derivation from shared metrics module so client and server
// share one canonical implementation.
export {
  deriveAttendanceMetrics,
  type AttendanceMetrics,
} from '@/lib/metrics'
