import 'server-only'

import { db } from './supabase'
import type { Employee, EmployeeStatus } from './types'
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '@/lib/validators/employee'

/**
 * Per product decision passwords are stored as plain text so admins can see
 * and reset them. Map `password` form field → `password` DB column verbatim.
 * Empty/whitespace value is treated as "don't change".
 */
function withPassword<T extends { password?: string | null }>(
  input: T
): T & { password?: string | null } {
  const { password, ...rest } = input
  if (password === undefined) return rest as T & { password?: string | null }
  if (password === null) return { ...rest, password: null } as T & { password?: string | null }
  const trimmed = password.trim()
  if (!trimmed) return rest as T & { password?: string | null }
  return { ...rest, password: trimmed } as T & { password?: string | null }
}

// Column list returned by admin-facing list/get/update endpoints. Now
// INCLUDES `password` because the admin UI shows it directly. Do not expose
// these endpoints to non-admin clients.
const PUBLIC_COLUMNS = [
  'id', 'full_name', 'email', 'phone', 'address', 'birthday', 'joining_date',
  'role_id', 'department_id',
  'working_hours_start', 'working_hours_end', 'working_days',
  'status', 'performance', 'avatar_url',
  'username', 'password',
  'created_at', 'updated_at',
].join(', ')

const SELECT =
  `${PUBLIC_COLUMNS}, role:roles ( id, name, color ), department:departments ( id, name, color )`

// Used only by the login flow on the server. Same as SELECT now since
// password is part of the public columns, but kept named for clarity.
const AUTH_SELECT = SELECT

export interface ListEmployeesParams {
  search?: string
  department_id?: string
  role_id?: string
  status?: EmployeeStatus
  limit?: number
  offset?: number
}

export async function listEmployees(
  params: ListEmployeesParams = {}
): Promise<{ rows: Employee[]; count: number }> {
  let q = db()
    .from('employees')
    .select(SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.search) {
    const safe = params.search.replace(/[%_,]/g, ' ').trim()
    q = q.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
  }
  if (params.department_id) q = q.eq('department_id', params.department_id)
  if (params.role_id) q = q.eq('role_id', params.role_id)
  if (params.status) q = q.eq('status', params.status)

  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) throw error
  return { rows: (data ?? []) as unknown as Employee[], count: count ?? 0 }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await db()
    .from('employees')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Employee | null
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<Employee> {
  const { data, error } = await db()
    .from('employees')
    .insert(withPassword(input))
    .select(SELECT)
    .single()
  if (error) throw error
  return data as unknown as Employee
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput
): Promise<Employee> {
  const { data, error } = await db()
    .from('employees')
    .update(withPassword(input))
    .eq('id', id)
    .select(SELECT)
    .single()
  if (error) throw error
  return data as unknown as Employee
}

export async function findEmployeeByUsername(
  username: string
): Promise<Employee | null> {
  const { data, error } = await db()
    .from('employees')
    .select(AUTH_SELECT)
    .ilike('username', username)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Employee | null
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await db().from('employees').delete().eq('id', id)
  if (error) throw error
}

export async function employeeStats() {
  const { data, error } = await db().from('employees').select('status')
  if (error) throw error
  const total = data?.length ?? 0
  const active = data?.filter((r) => r.status === 'active').length ?? 0
  const onLeave = data?.filter((r) => r.status === 'on_leave').length ?? 0
  const inactive = data?.filter((r) => r.status === 'inactive').length ?? 0
  return { total, active, onLeave, inactive }
}
