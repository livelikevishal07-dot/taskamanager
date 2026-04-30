import 'server-only'
import { db } from './supabase'

export type HolidayType = 'public' | 'company' | 'optional'

export interface CompanyHoliday {
  id: string
  name: string
  date: string          // YYYY-MM-DD
  type: HolidayType
  recurring: boolean
  created_at: string
  updated_at: string
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listHolidays(params: { year?: number } = {}): Promise<CompanyHoliday[]> {
  const year = params.year ?? new Date().getFullYear()
  const { data, error } = await db()
    .from('company_holidays')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date', { ascending: true })
  if (error) throw error
  return (data ?? []) as CompanyHoliday[]
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createHoliday(input: {
  name: string
  date: string
  type?: HolidayType
  recurring?: boolean
}): Promise<CompanyHoliday> {
  const { data, error } = await db()
    .from('company_holidays')
    .insert({ type: 'public', recurring: false, ...input })
    .select()
    .single()
  if (error) throw error
  return data as CompanyHoliday
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateHoliday(
  id: string,
  input: Partial<{ name: string; date: string; type: HolidayType; recurring: boolean }>
): Promise<CompanyHoliday> {
  const { data, error } = await db()
    .from('company_holidays')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CompanyHoliday
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await db().from('company_holidays').delete().eq('id', id)
  if (error) throw error
}
