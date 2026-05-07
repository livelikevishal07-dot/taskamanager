'use client'

import * as React from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer, CartesianGrid,
  XAxis, YAxis, Tooltip,
} from 'recharts'
import {
  BookOpen, IndianRupee, Wallet, Clock,
  TrendingUp, CalendarRange,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id:               string
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
  created_at:       string
  employee?: { full_name: string; department?: { name: string } | null } | null
}

interface EmployeeOption {
  id:        string
  full_name: string
}

interface Props {
  employees: EmployeeOption[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const WEBSITE_COLORS: Record<string, string> = {
  BalloonDekor: '#6F5CFF',
  '7eventzz':   '#27C0DE',
  Giftlaya:     '#F47A6F',
}

const PLATFORM_COLORS: Record<string, string> = {
  WhatsApp: '#22C58B',
  Website:  '#6F5CFF',
  Others:   '#F2B544',
}

const OCCASION_COLORS = [
  '#6F5CFF','#27C0DE','#F47A6F','#22C58B',
  '#F2B544','#A855F7','#EC4899','#F97316',
  '#06B6D4','#84CC16','#EF4444','#8B5CF6',
]

// ── Utils ─────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-xs shadow-pop">
      {label && <p className="mb-1.5 font-semibold text-ink">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-soft">{p.name}:</span>
          <span className="font-semibold">₹{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, bgCls, textCls, icon: Icon,
}: {
  label: string; value: string; sub?: string
  bgCls: string; textCls: string; icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className={cn('grid size-10 place-items-center rounded-xl', bgCls, textCls)}>
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  )
}

// ── Trend Chart (daily or monthly buckets) ───────────────────────────────────

function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function diffDays(from: string, to: string) {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000) + 1
}

function TrendChart({ bookings, from, to }: { bookings: Booking[]; from: string; to: string }) {
  const days = diffDays(from, to)
  const useMonthly = days > 62

  const data = React.useMemo(() => {
    const start = parseISO(from)
    const end = parseISO(to)
    if (useMonthly) {
      const map = new Map<string, { label: string; revenue: number; advance: number }>()
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        map.set(key, { label: `${MONTHS[cursor.getMonth()].slice(0, 3)} ${String(cursor.getFullYear()).slice(2)}`, revenue: 0, advance: 0 })
        cursor.setMonth(cursor.getMonth() + 1)
      }
      bookings.forEach(b => {
        const key = b.order_date.slice(0, 7)
        const cur = map.get(key)
        if (cur) {
          cur.revenue += b.total_amount
          cur.advance += b.advance_paid
        }
      })
      return [...map.values()]
    }
    const out: { label: string; revenue: number; advance: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate())
      const day = bookings.filter(b => b.order_date === iso)
      out.push({
        label: days <= 31 ? String(d.getDate()) : `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: day.reduce((s, b) => s + b.total_amount, 0),
        advance: day.reduce((s, b) => s + b.advance_paid, 0),
      })
    }
    return out
  }, [bookings, from, to, days, useMonthly])

  const interval = data.length > 30 ? Math.ceil(data.length / 12) : data.length > 14 ? 2 : 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{useMonthly ? 'Monthly Revenue Trend' : 'Daily Revenue Trend'}</h3>
          <p className="text-xs text-ink-soft">{from} → {to} — by booking date</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-violet" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-emerald" />
            Advance
          </span>
        </div>
      </div>
      <div className="h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6F5CFF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6F5CFF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-adv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C58B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22C58B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--ink-soft))' }}
              interval={interval}
            />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--ink-soft))' }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="advance" name="Advance"
              stroke="#22C58B" strokeWidth={2} fill="url(#g-adv)" />
            <Area type="monotone" dataKey="revenue" name="Revenue"
              stroke="#6F5CFF" strokeWidth={2.5} fill="url(#g-rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Website Revenue ───────────────────────────────────────────────────────────

function WebsiteChart({ bookings }: { bookings: Booking[] }) {
  const sites = ['BalloonDekor', '7eventzz', 'Giftlaya']
  const data = sites.map(site => ({
    name: site,
    Revenue: bookings.filter(b => b.website === site).reduce((s, b) => s + b.total_amount, 0),
    Count:   bookings.filter(b => b.website === site).length,
  }))

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-base font-semibold">Revenue by Website</h3>
      <p className="text-xs text-ink-soft mb-4">Total booking value per brand</p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--ink-soft))' }} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--ink-soft))' }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="Revenue" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {data.map(d => (
                <Cell key={d.name} fill={WEBSITE_COLORS[d.name] ?? '#6F5CFF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: WEBSITE_COLORS[d.name] }} />
            <span className="text-xs text-ink-soft">{d.name}</span>
            <span className="text-xs font-bold">{d.Count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Occasion Donut ────────────────────────────────────────────────────────────

const RADIAN = Math.PI / 180
function OccasionChart({ bookings }: { bookings: Booking[] }) {
  const map = new Map<string, number>()
  bookings.forEach(b => map.set(b.occasion, (map.get(b.occasion) ?? 0) + 1))
  const data = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.06) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle"
        dominantBaseline="central" fontSize={10} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-base font-semibold">Occasion Breakdown</h3>
      <p className="text-xs text-ink-soft mb-4">Count distribution across event types</p>
      {data.length === 0 ? (
        <div className="h-[200px] grid place-items-center text-sm text-ink-soft">No data</div>
      ) : (
        <>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={82}
                  labelLine={false} label={renderLabel}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={OCCASION_COLORS[i % OCCASION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{
                    background: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12, fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {data.slice(0, 10).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                <span className="size-2 shrink-0 rounded-full"
                  style={{ background: OCCASION_COLORS[i % OCCASION_COLORS.length] }} />
                <span className="truncate text-[11px] text-ink-soft">{d.name}</span>
                <span className="ml-auto shrink-0 text-[11px] font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Platform Breakdown ────────────────────────────────────────────────────────

function PlatformChart({ bookings }: { bookings: Booking[] }) {
  const platforms = ['WhatsApp', 'Website', 'Others']
  const total = bookings.length || 1
  const data = platforms.map(p => ({
    name: p,
    count:   bookings.filter(b => b.booking_platform === p).length,
    revenue: bookings.filter(b => b.booking_platform === p).reduce((s, b) => s + b.total_amount, 0),
    color:   PLATFORM_COLORS[p],
  }))

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-base font-semibold">Booking Platform</h3>
      <p className="text-xs text-ink-soft mb-5">How customers are reaching you</p>
      <div className="space-y-4">
        {data.map(d => (
          <div key={d.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-sm font-medium">{d.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-ink-soft">₹{fmt(d.revenue)}</span>
                <span className="text-sm font-bold">{d.count}
                  <span className="ml-1 text-xs font-normal text-ink-soft">
                    ({Math.round((d.count / total) * 100)}%)
                  </span>
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((d.count / total) * 100)}%`, background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Employee Leaderboard ──────────────────────────────────────────────────────

function EmployeeLeaderboard({ bookings }: { bookings: Booking[] }) {
  const map = new Map<string, { name: string; count: number; revenue: number }>()
  bookings.forEach(b => {
    const name = b.employee?.full_name ?? 'Unknown'
    const prev = map.get(b.employee_id) ?? { name, count: 0, revenue: 0 }
    map.set(b.employee_id, {
      name, count: prev.count + 1,
      revenue: prev.revenue + b.total_amount,
    })
  })
  const rows = [...map.values()].sort((a, b) => b.count - a.count)
  const maxCount = Math.max(1, ...rows.map(r => r.count))
  const rankColors = ['#F2B544', '#9CA3AF', '#CD7C2A']

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h3 className="text-base font-semibold">Employee Leaderboard</h3>
      <p className="text-xs text-ink-soft mb-5">Bookings recorded per team member</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">No data for this period</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r, i) => (
            <div key={r.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: rankColors[i] ?? '#6F5CFF' }}>
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-medium">{r.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink-soft">₹{fmt(r.revenue)}</span>
                  <span className="text-sm font-bold">{r.count}
                    <span className="ml-1 text-xs font-normal text-ink-soft">entries</span>
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.round((r.count / maxCount) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Analysis Component ───────────────────────────────────────────────────

type RangeMode = 'today' | 'week' | 'month' | '6months' | 'custom'

const RANGE_LABELS: Record<RangeMode, string> = {
  today:    'Today',
  week:     'Last 7 days',
  month:    'Last 30 days',
  '6months': 'Last 6 months',
  custom:   'Custom',
}

function todayISO() {
  const d = new Date()
  return toISO(d.getFullYear(), d.getMonth(), d.getDate())
}

function computeRange(mode: RangeMode, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date()
  const to = todayISO()
  if (mode === 'today') return { from: to, to }
  if (mode === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - 6)
    return { from: toISO(s.getFullYear(), s.getMonth(), s.getDate()), to }
  }
  if (mode === 'month') {
    const s = new Date(now); s.setDate(now.getDate() - 29)
    return { from: toISO(s.getFullYear(), s.getMonth(), s.getDate()), to }
  }
  if (mode === '6months') {
    const s = new Date(now); s.setMonth(now.getMonth() - 6); s.setDate(s.getDate() + 1)
    return { from: toISO(s.getFullYear(), s.getMonth(), s.getDate()), to }
  }
  if (customFrom && customTo) {
    return customFrom <= customTo ? { from: customFrom, to: customTo } : { from: customTo, to: customFrom }
  }
  return { from: to, to }
}

export function AdminBookingsAnalysis({ employees }: Props) {
  const [rangeMode, setRangeMode] = React.useState<RangeMode>('month')
  const [customFrom, setCustomFrom] = React.useState(todayISO())
  const [customTo, setCustomTo]   = React.useState(todayISO())

  const { from, to } = React.useMemo(
    () => computeRange(rangeMode, customFrom, customTo),
    [rangeMode, customFrom, customTo],
  )
  const totalDays = Math.max(1, diffDays(from, to))

  const [empFilter,  setEmpFilter]  = React.useState('')
  const [siteFilter, setSiteFilter] = React.useState('')
  const [platFilter, setPlatFilter] = React.useState('')

  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading,  setLoading]  = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({ from, to, with_employee: '1' })
      if (empFilter) sp.set('employee_id', empFilter)
      const res = await fetch(`/api/bookings?${sp}`)
      const data = await res.json()
      // Defensive: ensure numeric fields are real numbers even if the
      // backend ever sends them as strings (Postgres `numeric` quirk).
      const rows: Booking[] = Array.isArray(data)
        ? data.map((b: any) => ({
            ...b,
            total_amount: Number(b.total_amount) || 0,
            advance_paid: Number(b.advance_paid) || 0,
          }))
        : []
      setBookings(rows)
    } finally {
      setLoading(false)
    }
  }, [from, to, empFilter])

  React.useEffect(() => { load() }, [load])

  const filtered = bookings.filter(b =>
    (!siteFilter || b.website          === siteFilter) &&
    (!platFilter || b.booking_platform === platFilter)
  )

  const totalBookings = filtered.length
  const totalRevenue  = filtered.reduce((s, b) => s + b.total_amount, 0)
  const totalAdvance  = filtered.reduce((s, b) => s + b.advance_paid, 0)
  const totalPending  = totalRevenue - totalAdvance
  const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
  const avgPerDay     = totalBookings / totalDays

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-1.5 shadow-card">
          <CalendarRange className="size-4 text-ink-muted" />
          <select value={rangeMode}
            onChange={e => setRangeMode(e.target.value as RangeMode)}
            className="bg-transparent text-sm font-semibold text-ink focus:outline-none cursor-pointer">
            {(Object.keys(RANGE_LABELS) as RangeMode[]).map(k => (
              <option key={k} value={k}>{RANGE_LABELS[k]}</option>
            ))}
          </select>
        </div>

        {rangeMode === 'custom' && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 shadow-card">
            <input type="date" value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer" />
            <span className="text-ink-soft text-xs">→</span>
            <input type="date" value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer" />
          </div>
        )}

        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-ink-muted shadow-card focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer">
          <option value="">All Employees</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.full_name}</option>
          ))}
        </select>

        <select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-ink-muted shadow-card focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer">
          <option value="">All Websites</option>
          {['BalloonDekor', '7eventzz', 'Giftlaya'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={platFilter} onChange={e => setPlatFilter(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-ink-muted shadow-card focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 cursor-pointer">
          <option value="">All Platforms</option>
          {['WhatsApp', 'Website', 'Others'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {loading && (
          <span className="text-xs text-ink-soft animate-pulse">Loading…</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Bookings" value={String(totalBookings)}
          sub={RANGE_LABELS[rangeMode]}
          bgCls="bg-brand/10" textCls="text-brand" icon={BookOpen}
        />
        <StatCard
          label="Total Revenue" value={`₹${fmt(totalRevenue)}`}
          sub="all orders combined"
          bgCls="bg-violet/10" textCls="text-violet" icon={IndianRupee}
        />
        <StatCard
          label="Avg Order Value" value={`₹${fmt(avgOrderValue)}`}
          sub={`across ${fmt(totalBookings)} order${totalBookings === 1 ? '' : 's'}`}
          bgCls="bg-amber/10" textCls="text-amber" icon={TrendingUp}
        />
        <StatCard
          label="Avg Bookings / Day" value={avgPerDay.toFixed(avgPerDay >= 10 ? 0 : 1)}
          sub={`over ${totalDays} day${totalDays === 1 ? '' : 's'}`}
          bgCls="bg-sky/10" textCls="text-sky" icon={CalendarRange}
        />
        <StatCard
          label="Advance Collected" value={`₹${fmt(totalAdvance)}`}
          sub={`${totalRevenue ? Math.round((totalAdvance / totalRevenue) * 100) : 0}% collected`}
          bgCls="bg-emerald/10" textCls="text-emerald" icon={Wallet}
        />
        <StatCard
          label="Balance Pending" value={`₹${fmt(totalPending)}`}
          sub="yet to collect"
          bgCls="bg-coral/10" textCls="text-coral" icon={Clock}
        />
      </div>

      <TrendChart bookings={filtered} from={from} to={to} />

      <div className="grid gap-5 lg:grid-cols-2">
        <WebsiteChart  bookings={filtered} />
        <OccasionChart bookings={filtered} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlatformChart       bookings={filtered} />
        <EmployeeLeaderboard bookings={filtered} />
      </div>
    </div>
  )
}
