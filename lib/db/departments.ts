import 'server-only'

import { db } from './supabase'
import type { Department } from './types'

export async function listDepartments(): Promise<Department[]> {
  const { data, error } = await db()
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as Department[]
}

export async function getDepartment(id: string): Promise<Department | null> {
  const { data, error } = await db()
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Department | null
}

export async function createDepartment(input: {
  name: string
  description?: string | null
  lead_name?: string | null
  color?: string
}): Promise<Department> {
  const { data, error } = await db()
    .from('departments')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function updateDepartment(
  id: string,
  input: Partial<{
    name: string
    description: string | null
    lead_name: string | null
    color: string
  }>
): Promise<Department> {
  const { data, error } = await db()
    .from('departments')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await db().from('departments').delete().eq('id', id)
  if (error) throw error
}
