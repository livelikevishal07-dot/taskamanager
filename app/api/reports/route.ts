import { NextRequest } from 'next/server'
import { db } from '@/lib/db/supabase'
import { ok, fail, fromError } from '@/lib/http'

export const dynamic = 'force-dynamic'

const EMP_SELECT = 'id, full_name, department:departments(name), role:roles(name)'
const ATT_SELECT = `*, employee:employees(${EMP_SELECT})`
const LEAVE_SELECT = `*, employee:employees(${EMP_SELECT})`

export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams
  const type = sp.get('type')
  const from = sp.get('from')
  const to   = sp.get('to')
  const date = sp.get('date')

  try {
    // ── 1. Daily Punch In ─────────────────────────────────────────────────────
    if (type === 'punch-in') {
      const d = date ?? new Date().toISOString().slice(0, 10)
      const { data, error } = await db()
        .from('attendance_sessions')
        .select(ATT_SELECT)
        .eq('date', d)
        .order('login_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return ok(data ?? [])
    }

    // ── 2. Day Wise Master ────────────────────────────────────────────────────
    if (type === 'daywise') {
      if (!from || !to) return fail(400, 'from and to are required')
      const { data, error } = await db()
        .from('attendance_sessions')
        .select(ATT_SELECT)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
      if (error) throw error
      return ok(data ?? [])
    }

    // ── 3. Working Hours ──────────────────────────────────────────────────────
    if (type === 'working-hours') {
      if (!from || !to) return fail(400, 'from and to are required')
      const { data, error } = await db()
        .from('attendance_sessions')
        .select(ATT_SELECT)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
      if (error) throw error
      return ok(data ?? [])
    }

    // ── 4. Leave Taken ────────────────────────────────────────────────────────
    if (type === 'leave') {
      if (!from || !to) return fail(400, 'from and to are required')
      const leaveType = sp.get('leave_type')
      const status    = sp.get('status')

      let q = db()
        .from('leave_requests')
        .select(LEAVE_SELECT)
        // Show leaves that overlap the selected range
        .lte('from_date', to)
        .gte('to_date', from)
        .order('from_date', { ascending: false })

      if (leaveType) q = q.eq('type', leaveType)
      if (status)    q = q.eq('status', status)

      const { data, error } = await q
      if (error) throw error
      return ok(data ?? [])
    }

    return fail(400, 'Invalid report type. Use: punch-in | daywise | working-hours | leave')
  } catch (err) {
    return fromError(err)
  }
}
