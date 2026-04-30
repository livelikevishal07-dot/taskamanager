import 'server-only'

import { db } from './supabase'

export interface TaskTemplate {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  company_id: string | null
  created_at: string
  updated_at: string
  company: { id: string; name: string; color: string } | null
  employee_assignments: Array<{
    employee_id: string
    employee: { id: string; full_name: string } | null
  }>
}

const TEMPLATE_SELECT =
  '*, company:companies(id, name, color), employee_assignments:task_template_employees(employee_id, employee:employees(id, full_name))'

// ── List ───────────────────────────────────────────────────────────────────

export async function listTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await db()
    .from('task_templates')
    .select(TEMPLATE_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as TaskTemplate[]
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function createTemplate(input: {
  title: string
  description?: string | null
  priority?: string
  company_id?: string | null
  employee_ids?: string[]
}): Promise<TaskTemplate> {
  const { employee_ids, ...templateInput } = input

  const { data, error } = await db()
    .from('task_templates')
    .insert(templateInput)
    .select('id')
    .single()
  if (error) throw error

  const templateId = (data as { id: string }).id

  if (employee_ids && employee_ids.length > 0) {
    const { error: aErr } = await db()
      .from('task_template_employees')
      .insert(employee_ids.map((eid) => ({ template_id: templateId, employee_id: eid })))
    if (aErr) throw aErr
  }

  const { data: full, error: fErr } = await db()
    .from('task_templates')
    .select(TEMPLATE_SELECT)
    .eq('id', templateId)
    .single()
  if (fErr) throw fErr
  return full as unknown as TaskTemplate
}

// ── Update ─────────────────────────────────────────────────────────────────

export async function updateTemplate(
  id: string,
  input: Partial<{
    title: string
    description: string | null
    priority: string
    company_id: string | null
    employee_ids: string[]
  }>
): Promise<TaskTemplate> {
  const { employee_ids, ...templateInput } = input

  if (Object.keys(templateInput).length > 0) {
    const { error } = await db()
      .from('task_templates')
      .update(templateInput)
      .eq('id', id)
    if (error) throw error
  }

  if (employee_ids !== undefined) {
    const { data: current } = await db()
      .from('task_template_employees')
      .select('employee_id')
      .eq('template_id', id)
    const currentIds = (current ?? []).map((r: { employee_id: string }) => r.employee_id)

    const toAdd = employee_ids.filter((eid) => !currentIds.includes(eid))
    if (toAdd.length > 0) {
      await db()
        .from('task_template_employees')
        .insert(toAdd.map((eid) => ({ template_id: id, employee_id: eid })))
    }

    const toRemove = currentIds.filter((eid) => !employee_ids.includes(eid))
    if (toRemove.length > 0) {
      await db()
        .from('task_template_employees')
        .delete()
        .eq('template_id', id)
        .in('employee_id', toRemove)
    }
  }

  const { data: full, error: fErr } = await db()
    .from('task_templates')
    .select(TEMPLATE_SELECT)
    .eq('id', id)
    .single()
  if (fErr) throw fErr
  return full as unknown as TaskTemplate
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await db().from('task_templates').delete().eq('id', id)
  if (error) throw error
}
