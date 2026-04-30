import 'server-only'

import { db } from './supabase'
import type { Role } from './types'

export async function listRoles(): Promise<Role[]> {
  const { data, error } = await db().from('roles').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Role[]
}

export async function getRole(id: string): Promise<Role | null> {
  const { data, error } = await db()
    .from('roles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Role | null
}

export async function createRole(input: {
  name: string
  description?: string | null
  color?: string
}): Promise<Role> {
  const { data, error } = await db()
    .from('roles')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function updateRole(
  id: string,
  input: Partial<{ name: string; description: string | null; color: string }>
): Promise<Role> {
  const { data, error } = await db()
    .from('roles')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await db().from('roles').delete().eq('id', id)
  if (error) throw error
}
