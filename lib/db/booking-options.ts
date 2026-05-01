import 'server-only'
import { db } from './supabase'

export interface BookingOption {
  id:         string
  type:       'website' | 'platform'
  label:      string
  sort_order: number
  created_at: string
}

export async function getBookingOptions(): Promise<BookingOption[]> {
  const { data, error } = await db()
    .from('booking_options')
    .select('*')
    .order('type')
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return (data ?? []) as BookingOption[]
}

export async function createBookingOption(
  type: 'website' | 'platform',
  label: string,
): Promise<BookingOption> {
  // Place new option after the current last one for that type
  const { data: existing } = await db()
    .from('booking_options')
    .select('sort_order')
    .eq('type', type)
    .order('sort_order', { ascending: false })
    .limit(1)
  const maxOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db()
    .from('booking_options')
    .insert({ type, label: label.trim(), sort_order: maxOrder })
    .select()
    .single()
  if (error) throw error
  return data as BookingOption
}

export async function deleteBookingOption(id: string): Promise<void> {
  const { error } = await db()
    .from('booking_options')
    .delete()
    .eq('id', id)
  if (error) throw error
}
