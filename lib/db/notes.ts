import 'server-only'
import { db } from './supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Note {
  id:          string
  employee_id: string
  title:       string | null
  content:     string
  color:       string
  created_at:  string
  updated_at:  string
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listNotes(employeeId: string): Promise<Note[]> {
  const { data, error } = await db()
    .from('employee_notes')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Note[]
}

export async function createNote(input: {
  employee_id: string
  title?:      string | null
  content:     string
  color?:      string
}): Promise<Note> {
  const { data, error } = await db()
    .from('employee_notes')
    .insert({
      employee_id: input.employee_id,
      title:       input.title ?? null,
      content:     input.content,
      color:       input.color ?? 'default',
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Note
}

export async function updateNote(
  id: string,
  employeeId: string,
  patch: Partial<{ title: string | null; content: string; color: string }>,
): Promise<Note> {
  const { data, error } = await db()
    .from('employee_notes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('employee_id', employeeId)   // employee can only edit own notes
    .select('*')
    .single()
  if (error) throw error
  return data as Note
}

export async function deleteNote(id: string, employeeId: string): Promise<void> {
  const { error } = await db()
    .from('employee_notes')
    .delete()
    .eq('id', id)
    .eq('employee_id', employeeId)   // ensures employee can only delete own notes
  if (error) throw error
}
