import 'server-only'
import { db } from './supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Booking {
  id:               string
  employee_id:      string
  order_date:       string   // YYYY-MM-DD
  customer_name:    string
  customer_phone:   string
  city:             string
  event_date:       string   // YYYY-MM-DD
  total_amount:     number
  advance_paid:     number
  website:          string
  occasion:         string
  booking_platform: string
  created_at:       string
}

export interface BookingWithEmployee extends Booking {
  employee?: { full_name: string; department?: { name: string } | null } | null
}

// ── Type-safe coercion ───────────────────────────────────────────────────────
// Postgres `numeric` is returned by supabase-js as STRING ("49999.00") to
// preserve precision. JS math on strings silently breaks ("0" + "49999.00"
// is concat, not addition). Force-coerce to Number so every consumer
// downstream — charts, totals, sorting — gets real numbers.

function num(v: unknown): number {
  if (typeof v === 'number') return v
  if (v == null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalize<T extends { total_amount?: unknown; advance_paid?: unknown }>(row: T): T {
  return {
    ...row,
    total_amount: num(row.total_amount),
    advance_paid: num(row.advance_paid),
  } as T
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listBookings(params: {
  employee_id?: string
  from?: string
  to?: string
  event_from?: string
  event_to?: string
  limit?: number
  withEmployee?: boolean
}): Promise<BookingWithEmployee[]> {
  const select = params.withEmployee
    ? '*, employee:employees(full_name, department:departments(name))'
    : '*'

  let q = db()
    .from('bookings')
    .select(select)
    .order('order_date', { ascending: false })
    .order('created_at',  { ascending: false })

  if (params.employee_id) q = q.eq('employee_id', params.employee_id)
  if (params.from)        q = q.gte('order_date', params.from)
  if (params.to)          q = q.lte('order_date', params.to)
  if (params.event_from)  q = q.gte('event_date', params.event_from)
  if (params.event_to)    q = q.lte('event_date', params.event_to)
  if (params.limit)       q = q.limit(params.limit)

  const { data, error } = await q
  if (error) throw error
  // Dynamic select string defeats PostgREST's static typing — cast via unknown.
  return ((data ?? []) as unknown as BookingWithEmployee[]).map(normalize)
}

export async function createBooking(input: {
  employee_id:      string
  order_date:       string
  customer_name:    string
  customer_phone:   string
  city:             string
  event_date:       string
  total_amount:     number
  advance_paid:     number
  website:          string
  occasion:         string
  booking_platform: string
}): Promise<Booking> {
  const { data, error } = await db()
    .from('bookings')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return normalize(data as Booking)
}

export async function updateBooking(
  id: string,
  patch: Partial<{
    order_date:       string
    customer_name:    string
    customer_phone:   string
    city:             string
    event_date:       string
    total_amount:     number
    advance_paid:     number
    website:          string
    occasion:         string
    booking_platform: string
  }>,
): Promise<Booking> {
  const { data, error } = await db()
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalize(data as Booking)
}

export async function deleteBooking(id: string, employee_id: string): Promise<void> {
  const { error } = await db()
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('employee_id', employee_id)   // ensures employee can only delete own
  if (error) throw error
}

// ── Analytics helpers (admin only) ───────────────────────────────────────────

export async function getBookingSummary(params: { from: string; to: string }) {
  const { data, error } = await db()
    .from('bookings')
    .select('order_date, total_amount, advance_paid, city, website, occasion, booking_platform, employee_id')
    .gte('order_date', params.from)
    .lte('order_date', params.to)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    total_amount: num(row.total_amount),
    advance_paid: num(row.advance_paid),
  }))
}
