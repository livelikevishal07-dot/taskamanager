// Mock data for the dashboard. Swap this for real API calls later —
// keep the same shapes so components don't need to change.

export const APP_NAME = 'Officely'

export const KPIS = [
  {
    label: 'Active employees',
    value: '30',
    period: 'November 2024',
    accent: 'violet',
  },
  {
    label: 'Tasks completed',
    value: '240',
    period: 'November 2024',
    accent: 'sky',
  },
  {
    label: 'Hours logged',
    value: '5K+',
    period: 'November 2024',
    accent: 'indigo',
  },
  {
    label: 'Pending deadlines',
    value: '12',
    period: 'November 2024',
    accent: 'coral',
  },
] as const

export const CHART_SERIES = [
  { key: 'completed', label: 'Completed', color: '#F47A6F' },
  { key: 'in_progress', label: 'In progress', color: '#27C0DE' },
  { key: 'overdue', label: 'Overdue', color: '#5B7BFF' },
] as const

export const CHART_DATA = [
  { day: 'Jan 1', completed: 180, in_progress: 240, overdue: 110 },
  { day: 'Jan 2', completed: 250, in_progress: 220, overdue: 150 },
  { day: 'Jan 3', completed: 320, in_progress: 280, overdue: 200 },
  { day: 'Jan 4', completed: 280, in_progress: 350, overdue: 230 },
  { day: 'Jan 5', completed: 210, in_progress: 380, overdue: 260 },
  { day: 'Jan 6', completed: 260, in_progress: 320, overdue: 220 },
  { day: 'Jan 7', completed: 340, in_progress: 250, overdue: 180 },
  { day: 'Jan 8', completed: 410, in_progress: 220, overdue: 150 },
  { day: 'Jan 9', completed: 360, in_progress: 280, overdue: 200 },
  { day: 'Jan 10', completed: 290, in_progress: 320, overdue: 240 },
]

export const OVERVIEW = {
  primary: { label: 'Tasks', value: 680 },
  secondary: { label: 'Employees', value: 90 },
  bars: [
    { label: 'Tasks completed', value: 120, max: 200, color: 'bg-coral' },
    { label: 'In progress', value: 260, max: 300, color: 'bg-violet' },
    { label: 'Overdue', value: 18, max: 200, color: 'bg-indigo' },
  ],
}

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive'
export type EmployeeRole = 'Admin' | 'Manager' | 'Senior' | 'Employee' | 'Intern'

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: EmployeeRole
  department: string
  joinedAt: string
  status: EmployeeStatus
  performance: number // 0-100
}

export const EMPLOYEE_STATS = {
  total: 30,
  active: 26,
  onLeave: 3,
  newThisMonth: 4,
}

export type DepartmentColor =
  | 'violet'
  | 'sky'
  | 'indigo'
  | 'coral'
  | 'emerald'
  | 'amber'

export interface Department {
  id: string
  name: string
  description: string
  lead: string
  members: number
  color: DepartmentColor
}

export const DEPARTMENTS: Department[] = [
  { id: 'D-01', name: 'Engineering', description: 'Builds and maintains the platform.', lead: 'Ralph Edwards', members: 8, color: 'violet' },
  { id: 'D-02', name: 'Design', description: 'Brand, product design, and design system.', lead: 'Jenny Wilson', members: 3, color: 'sky' },
  { id: 'D-03', name: 'Marketing', description: 'Growth, content, and lifecycle.', lead: 'Esther Howard', members: 5, color: 'coral' },
  { id: 'D-04', name: 'Sales', description: 'Pipeline, AE coverage, and customer expansion.', lead: 'Courtney Henry', members: 4, color: 'emerald' },
  { id: 'D-05', name: 'Operations', description: 'Vendor management and on-ground execution.', lead: 'Brooklyn Simmons', members: 4, color: 'indigo' },
  { id: 'D-06', name: 'HR', description: 'Hiring, onboarding, performance, and benefits.', lead: 'Kristin Watson', members: 3, color: 'amber' },
]

// Plain names array for filter dropdowns
export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.name)

// Roles
export type RoleColor = 'coral' | 'violet' | 'indigo' | 'sky' | 'amber' | 'emerald'

export interface Role {
  id: string
  name: string
  description: string
  members: number
  color: RoleColor
}

export const ROLES: Role[] = [
  { id: 'R-01', name: 'Admin', description: 'Full access. Manages billing, members, and settings.', members: 1, color: 'coral' },
  { id: 'R-02', name: 'Manager', description: 'Manages tasks, teams, and reviews their reports.', members: 4, color: 'violet' },
  { id: 'R-03', name: 'Senior', description: 'Senior IC — can create tasks and review work.', members: 6, color: 'indigo' },
  { id: 'R-04', name: 'Employee', description: 'Standard access. Updates their own tasks.', members: 16, color: 'sky' },
  { id: 'R-05', name: 'Intern', description: 'Read-mostly. Limited task assignment.', members: 3, color: 'amber' },
]

export const COLOR_TONE: Record<DepartmentColor, { bg: string; chip: string; bar: string; text: string }> = {
  violet: { bg: 'bg-violet', chip: 'bg-violet/12 text-violet', bar: 'bg-violet', text: 'text-violet' },
  sky: { bg: 'bg-sky', chip: 'bg-sky/12 text-sky', bar: 'bg-sky', text: 'text-sky' },
  indigo: { bg: 'bg-indigo', chip: 'bg-indigo/12 text-indigo', bar: 'bg-indigo', text: 'text-indigo' },
  coral: { bg: 'bg-coral', chip: 'bg-coral/12 text-coral', bar: 'bg-coral', text: 'text-coral' },
  emerald: { bg: 'bg-emerald', chip: 'bg-emerald/12 text-emerald', bar: 'bg-emerald', text: 'text-emerald' },
  amber: { bg: 'bg-amber', chip: 'bg-amber/15 text-amber', bar: 'bg-amber', text: 'text-amber' },
}

export const COLOR_OPTIONS: DepartmentColor[] = [
  'violet', 'sky', 'indigo', 'coral', 'emerald', 'amber',
]

export const EMPLOYEES: Employee[] = [
  {
    id: 'EMP-1042',
    name: 'Ralph Edwards',
    email: 'ralph.edwards@officely.io',
    phone: '+1 (415) 555-0123',
    role: 'Manager',
    department: 'Engineering',
    joinedAt: '12 Mar 2022',
    status: 'active',
    performance: 92,
  },
  {
    id: 'EMP-1043',
    name: 'Jenny Wilson',
    email: 'jenny.wilson@officely.io',
    phone: '+1 (415) 555-0145',
    role: 'Senior',
    department: 'Design',
    joinedAt: '04 Jul 2022',
    status: 'active',
    performance: 88,
  },
  {
    id: 'EMP-1044',
    name: 'Darrell Steward',
    email: 'darrell.s@officely.io',
    phone: '+1 (415) 555-0192',
    role: 'Employee',
    department: 'Engineering',
    joinedAt: '09 Sep 2023',
    status: 'active',
    performance: 76,
  },
  {
    id: 'EMP-1045',
    name: 'Cameron Williamson',
    email: 'cameron.w@officely.io',
    phone: '+1 (415) 555-0177',
    role: 'Senior',
    department: 'Marketing',
    joinedAt: '21 Jan 2021',
    status: 'on_leave',
    performance: 81,
  },
  {
    id: 'EMP-1046',
    name: 'Esther Howard',
    email: 'esther.h@officely.io',
    phone: '+1 (415) 555-0118',
    role: 'Manager',
    department: 'Sales',
    joinedAt: '15 Feb 2023',
    status: 'active',
    performance: 94,
  },
  {
    id: 'EMP-1047',
    name: 'Brooklyn Simmons',
    email: 'brooklyn.s@officely.io',
    phone: '+1 (415) 555-0162',
    role: 'Employee',
    department: 'Operations',
    joinedAt: '08 May 2024',
    status: 'active',
    performance: 70,
  },
  {
    id: 'EMP-1048',
    name: 'Leslie Alexander',
    email: 'leslie.a@officely.io',
    phone: '+1 (415) 555-0136',
    role: 'Senior',
    department: 'Engineering',
    joinedAt: '02 Nov 2022',
    status: 'active',
    performance: 85,
  },
  {
    id: 'EMP-1049',
    name: 'Kristin Watson',
    email: 'kristin.w@officely.io',
    phone: '+1 (415) 555-0109',
    role: 'Employee',
    department: 'HR',
    joinedAt: '17 Aug 2023',
    status: 'inactive',
    performance: 62,
  },
  {
    id: 'EMP-1050',
    name: 'Robert Fox',
    email: 'robert.fox@officely.io',
    phone: '+1 (415) 555-0181',
    role: 'Intern',
    department: 'Design',
    joinedAt: '01 Oct 2024',
    status: 'active',
    performance: 58,
  },
  {
    id: 'EMP-1051',
    name: 'Wade Warren',
    email: 'wade.w@officely.io',
    phone: '+1 (415) 555-0154',
    role: 'Employee',
    department: 'Marketing',
    joinedAt: '11 Jun 2023',
    status: 'active',
    performance: 79,
  },
  {
    id: 'EMP-1052',
    name: 'Courtney Henry',
    email: 'courtney.h@officely.io',
    phone: '+1 (415) 555-0142',
    role: 'Senior',
    department: 'Sales',
    joinedAt: '26 Apr 2022',
    status: 'on_leave',
    performance: 87,
  },
  {
    id: 'EMP-1053',
    name: 'Jacob Jones',
    email: 'jacob.jones@officely.io',
    phone: '+1 (415) 555-0188',
    role: 'Employee',
    department: 'Engineering',
    joinedAt: '03 Mar 2024',
    status: 'active',
    performance: 73,
  },
]

// ── COMPANIES ──────────────────────────────────────────────────────────

export type CompanyAccent =
  | 'violet'
  | 'sky'
  | 'indigo'
  | 'coral'
  | 'emerald'
  | 'amber'

export interface Company {
  id: string
  name: string
  slug: string
  industry: string
  description: string
  accent: CompanyAccent
  activeTasks: number
  members: number
  createdAt: string
}

export const COMPANIES: Company[] = [
  {
    id: 'CO-01',
    name: '7eventzz',
    slug: '7eventzz',
    industry: 'Event management',
    description: 'End-to-end event planning, production & on-ground execution.',
    accent: 'violet',
    activeTasks: 18,
    members: 12,
    createdAt: '04 Feb 2022',
  },
  {
    id: 'CO-02',
    name: 'Giftlaya',
    slug: 'giftlaya',
    industry: 'Gifting & e-commerce',
    description: 'Curated personalised gifting for occasions and brands.',
    accent: 'coral',
    activeTasks: 11,
    members: 8,
    createdAt: '18 Jul 2022',
  },
  {
    id: 'CO-03',
    name: 'Balloondekor',
    slug: 'balloondekor',
    industry: 'Decoration services',
    description: 'Balloon styling, themed décor and party setups.',
    accent: 'sky',
    activeTasks: 9,
    members: 6,
    createdAt: '12 Mar 2023',
  },
  {
    id: 'CO-04',
    name: 'Clearlevel',
    slug: 'clearlevel',
    industry: 'Consulting',
    description: 'Operations & growth consulting for early-stage businesses.',
    accent: 'emerald',
    activeTasks: 7,
    members: 5,
    createdAt: '02 Sep 2023',
  },
]

export const COMPANY_ACCENT: Record<CompanyAccent, { bg: string; chip: string; bar: string; text: string }> = {
  violet: { bg: 'bg-violet', chip: 'bg-violet/12 text-violet', bar: 'bg-violet', text: 'text-violet' },
  sky: { bg: 'bg-sky', chip: 'bg-sky/12 text-sky', bar: 'bg-sky', text: 'text-sky' },
  indigo: { bg: 'bg-indigo', chip: 'bg-indigo/12 text-indigo', bar: 'bg-indigo', text: 'text-indigo' },
  coral: { bg: 'bg-coral', chip: 'bg-coral/12 text-coral', bar: 'bg-coral', text: 'text-coral' },
  emerald: { bg: 'bg-emerald', chip: 'bg-emerald/12 text-emerald', bar: 'bg-emerald', text: 'text-emerald' },
  amber: { bg: 'bg-amber', chip: 'bg-amber/15 text-amber', bar: 'bg-amber', text: 'text-amber' },
}

export function getCompany(name: string) {
  return COMPANIES.find((c) => c.name === name)
}

// ── TASKS ──────────────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  deadline: string
  team: string
  company: string
  assignees: string[]
  tags: { label: string; tone: 'violet' | 'sky' | 'indigo' | 'coral' | 'emerald' | 'amber' }[]
  comments: number
  attachments: number
}

export const TASK_STATS = {
  total: 184,
  inProgress: 47,
  completedToday: 12,
  overdue: 6,
}

export const TASK_COLUMNS: { key: TaskStatus; label: string; tone: string }[] = [
  { key: 'todo', label: 'To do', tone: 'bg-ink-soft' },
  { key: 'in_progress', label: 'In progress', tone: 'bg-indigo' },
  { key: 'review', label: 'In review', tone: 'bg-amber' },
  { key: 'done', label: 'Done', tone: 'bg-emerald' },
]

export const TASKS: Task[] = [
  {
    id: 'T-2041',
    title: 'Vendor coordination — Bansal sangeet',
    description: 'Lock 4 décor vendors and final headcount with the family.',
    priority: 'high',
    status: 'in_progress',
    deadline: 'Tomorrow, 6:00 PM',
    team: 'Engineering Squad',
    company: '7eventzz',
    assignees: ['Ralph Edwards', 'Leslie Alexander'],
    tags: [
      { label: 'Backend', tone: 'indigo' },
      { label: 'Auth', tone: 'violet' },
    ],
    comments: 4,
    attachments: 2,
  },
  {
    id: 'T-2042',
    title: 'Anniversary gift hampers — Vol. 4',
    description: 'Curate 6 hamper combos under ₹2k and shoot product photos.',
    priority: 'medium',
    status: 'in_progress',
    deadline: 'Fri, 12 Jan',
    team: 'Design Studio',
    company: 'Giftlaya',
    assignees: ['Jenny Wilson', 'Robert Fox'],
    tags: [{ label: 'UI', tone: 'sky' }],
    comments: 7,
    attachments: 5,
  },
  {
    id: 'T-2043',
    title: 'Instagram reels script — Jan',
    description: '5 reel scripts for balloon arch setups & behind-the-scenes.',
    priority: 'low',
    status: 'todo',
    deadline: 'Mon, 15 Jan',
    team: 'Marketing Crew',
    company: 'Balloondekor',
    assignees: ['Esther Howard'],
    tags: [{ label: 'Content', tone: 'amber' }],
    comments: 1,
    attachments: 0,
  },
  {
    id: 'T-2044',
    title: 'Client deliverable — Acme growth audit',
    description: 'Final audit deck due tonight. 3 sections still open.',
    priority: 'urgent',
    status: 'in_progress',
    deadline: 'Today, 11:00 PM',
    team: 'Engineering Squad',
    company: 'Clearlevel',
    assignees: ['Darrell Steward'],
    tags: [
      { label: 'Bug', tone: 'coral' },
      { label: 'Billing', tone: 'indigo' },
    ],
    comments: 12,
    attachments: 1,
  },
  {
    id: 'T-2045',
    title: 'Onboard 2 freelance decorators',
    description: 'Brief & contracts for upcoming wedding season.',
    priority: 'medium',
    status: 'todo',
    deadline: 'Wed, 17 Jan',
    team: 'People & Culture',
    company: 'Balloondekor',
    assignees: ['Kristin Watson', 'Esther Howard'],
    tags: [{ label: 'Onboarding', tone: 'emerald' }],
    comments: 2,
    attachments: 3,
  },
  {
    id: 'T-2046',
    title: 'New landing page hero — 7eventzz',
    description: 'Direction approved — handoff after final copy review.',
    priority: 'high',
    status: 'review',
    deadline: 'Thu, 11 Jan',
    team: 'Design Studio',
    company: '7eventzz',
    assignees: ['Jenny Wilson'],
    tags: [
      { label: 'Web', tone: 'sky' },
      { label: 'Brand', tone: 'violet' },
    ],
    comments: 9,
    attachments: 8,
  },
  {
    id: 'T-2047',
    title: 'Bulk corporate gift quote — Infosys',
    description: 'Quote 500 hampers for company anniversary.',
    priority: 'medium',
    status: 'review',
    deadline: 'Fri, 12 Jan',
    team: 'Sales Force',
    company: 'Giftlaya',
    assignees: ['Courtney Henry', 'Wade Warren'],
    tags: [{ label: 'Sales', tone: 'emerald' }],
    comments: 3,
    attachments: 1,
  },
  {
    id: 'T-2048',
    title: 'Vendor onboarding playbook',
    description: 'Standard SOP for new décor vendors across all events.',
    priority: 'low',
    status: 'done',
    deadline: 'Done · 09 Jan',
    team: 'Engineering Squad',
    company: '7eventzz',
    assignees: ['Brooklyn Simmons'],
    tags: [{ label: 'Tech debt', tone: 'indigo' }],
    comments: 5,
    attachments: 0,
  },
  {
    id: 'T-2049',
    title: 'Q1 OKRs across all companies',
    description: 'Final pass with company leads before publishing.',
    priority: 'urgent',
    status: 'review',
    deadline: 'Today',
    team: 'People & Culture',
    company: 'Clearlevel',
    assignees: ['Esther Howard', 'Cameron Williamson'],
    tags: [{ label: 'Planning', tone: 'amber' }],
    comments: 6,
    attachments: 2,
  },
  {
    id: 'T-2050',
    title: 'Brand refresh — Balloondekor',
    description: 'New palette + typography rollout across collateral.',
    priority: 'low',
    status: 'todo',
    deadline: 'Tue, 16 Jan',
    team: 'Design Studio',
    company: 'Balloondekor',
    assignees: ['Robert Fox'],
    tags: [{ label: 'Design system', tone: 'sky' }],
    comments: 0,
    attachments: 4,
  },
  {
    id: 'T-2051',
    title: 'Client retro — Innov8 quarterly',
    description: '45-min retrospective with Innov8 ops team.',
    priority: 'medium',
    status: 'done',
    deadline: 'Done · 08 Jan',
    team: 'Marketing Crew',
    company: 'Clearlevel',
    assignees: ['Wade Warren'],
    tags: [{ label: 'Research', tone: 'violet' }],
    comments: 2,
    attachments: 1,
  },
]

// ── TEAMS ──────────────────────────────────────────────────────────────

export type TeamAccent =
  | 'violet'
  | 'sky'
  | 'indigo'
  | 'coral'
  | 'emerald'
  | 'amber'

export interface Team {
  id: string
  name: string
  description: string
  lead: string
  members: string[]
  totalTasks: number
  completed: number
  overdue: number
  accent: TeamAccent
}

export const TEAM_STATS = {
  total: 6,
  members: 30,
  activeTasks: 47,
  avgCompletion: 76,
}

export const TEAMS: Team[] = [
  {
    id: 'TEAM-01',
    name: 'Engineering Squad',
    description: 'Core platform, backend services, and infra.',
    lead: 'Ralph Edwards',
    members: [
      'Ralph Edwards',
      'Darrell Steward',
      'Leslie Alexander',
      'Brooklyn Simmons',
      'Jacob Jones',
    ],
    totalTasks: 38,
    completed: 24,
    overdue: 2,
    accent: 'violet',
  },
  {
    id: 'TEAM-02',
    name: 'Design Studio',
    description: 'Product design, brand, and design system.',
    lead: 'Jenny Wilson',
    members: ['Jenny Wilson', 'Robert Fox', 'Cameron Williamson'],
    totalTasks: 22,
    completed: 18,
    overdue: 1,
    accent: 'sky',
  },
  {
    id: 'TEAM-03',
    name: 'Marketing Crew',
    description: 'Growth, content, and lifecycle communications.',
    lead: 'Esther Howard',
    members: ['Esther Howard', 'Wade Warren'],
    totalTasks: 16,
    completed: 11,
    overdue: 0,
    accent: 'coral',
  },
  {
    id: 'TEAM-04',
    name: 'Sales Force',
    description: 'Outbound, AE pipeline, and customer expansion.',
    lead: 'Courtney Henry',
    members: ['Courtney Henry', 'Wade Warren', 'Cameron Williamson'],
    totalTasks: 19,
    completed: 12,
    overdue: 3,
    accent: 'emerald',
  },
  {
    id: 'TEAM-05',
    name: 'Product Ops',
    description: 'Roadmap coordination and cross-team rituals.',
    lead: 'Brooklyn Simmons',
    members: ['Brooklyn Simmons', 'Leslie Alexander'],
    totalTasks: 9,
    completed: 6,
    overdue: 0,
    accent: 'indigo',
  },
  {
    id: 'TEAM-06',
    name: 'People & Culture',
    description: 'Hiring, onboarding, performance, and benefits.',
    lead: 'Kristin Watson',
    members: ['Kristin Watson', 'Esther Howard'],
    totalTasks: 12,
    completed: 8,
    overdue: 0,
    accent: 'amber',
  },
]

// ── ATTENDANCE ──────────────────────────────────────────────────────────

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'leave'
  | 'weekend'
  | 'holiday'

export const ATTENDANCE_STATUS_TONE: Record<
  AttendanceStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  present: { dot: 'bg-emerald', bg: 'bg-emerald/15', text: 'text-emerald', label: 'Present' },
  late: { dot: 'bg-amber', bg: 'bg-amber/15', text: 'text-amber', label: 'Late' },
  absent: { dot: 'bg-coral', bg: 'bg-coral/15', text: 'text-coral', label: 'Absent' },
  leave: { dot: 'bg-violet', bg: 'bg-violet/15', text: 'text-violet', label: 'On leave' },
  weekend: { dot: 'bg-ink-soft', bg: 'bg-ink-soft/10', text: 'text-ink-soft', label: 'Weekend' },
  holiday: { dot: 'bg-indigo', bg: 'bg-indigo/15', text: 'text-indigo', label: 'Holiday' },
}

export const ATTENDANCE_STATS = {
  present: 24,
  late: 3,
  absent: 1,
  onLeave: 2,
  avgHours: 8.4,
}

export interface CheckInRow {
  employee: string
  role: string
  loginAt: string
  logoutAt: string | null
  hours: string
  company: string
  status: AttendanceStatus
}

export const TODAY_CHECKINS: CheckInRow[] = [
  { employee: 'Ralph Edwards', role: 'Manager', loginAt: '09:02 AM', logoutAt: null, hours: 'Working', company: '7eventzz', status: 'present' },
  { employee: 'Jenny Wilson', role: 'Senior', loginAt: '09:15 AM', logoutAt: null, hours: 'Working', company: 'Giftlaya', status: 'present' },
  { employee: 'Darrell Steward', role: 'Employee', loginAt: '10:42 AM', logoutAt: null, hours: 'Working', company: 'Clearlevel', status: 'late' },
  { employee: 'Cameron Williamson', role: 'Senior', loginAt: '—', logoutAt: '—', hours: '—', company: '7eventzz', status: 'leave' },
  { employee: 'Esther Howard', role: 'Manager', loginAt: '08:55 AM', logoutAt: null, hours: 'Working', company: '7eventzz', status: 'present' },
  { employee: 'Brooklyn Simmons', role: 'Employee', loginAt: '09:08 AM', logoutAt: '06:01 PM', hours: '8h 53m', company: 'Balloondekor', status: 'present' },
  { employee: 'Leslie Alexander', role: 'Senior', loginAt: '09:22 AM', logoutAt: null, hours: 'Working', company: 'Giftlaya', status: 'present' },
  { employee: 'Kristin Watson', role: 'Employee', loginAt: '—', logoutAt: '—', hours: '—', company: 'Clearlevel', status: 'absent' },
  { employee: 'Robert Fox', role: 'Intern', loginAt: '09:30 AM', logoutAt: null, hours: 'Working', company: 'Balloondekor', status: 'present' },
  { employee: 'Wade Warren', role: 'Employee', loginAt: '11:12 AM', logoutAt: null, hours: 'Working', company: 'Giftlaya', status: 'late' },
]

// 14-day attendance grid for first 8 employees
export const ATTENDANCE_DAYS: { label: string; date: number; isWeekend: boolean }[] =
  Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const day = d.getDay() // 0=Sun, 6=Sat
    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' })[0],
      date: d.getDate(),
      isWeekend: day === 0 || day === 6,
    }
  })

function genAttendanceRow(seed: string): AttendanceStatus[] {
  // deterministic pseudo-random based on name
  const out: AttendanceStatus[] = []
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  ATTENDANCE_DAYS.forEach((d, i) => {
    if (d.isWeekend) return out.push('weekend')
    h = (h * 1103515245 + 12345) & 0x7fffffff
    const r = h % 100
    if (r < 70) out.push('present')
    else if (r < 82) out.push('late')
    else if (r < 90) out.push('leave')
    else if (r < 95) out.push('absent')
    else out.push('present')
  })
  return out
}

export const ATTENDANCE_GRID = [
  'Ralph Edwards',
  'Jenny Wilson',
  'Darrell Steward',
  'Cameron Williamson',
  'Esther Howard',
  'Brooklyn Simmons',
  'Leslie Alexander',
  'Robert Fox',
].map((name) => ({ name, days: genAttendanceRow(name) }))

// ── PERFORMANCE ─────────────────────────────────────────────────────────

export const PERFORMANCE_STATS = {
  avgScore: 82,
  topPerformer: 'Esther Howard',
  improvement: 6,
  reviewsDue: 4,
}

export const PERFORMANCE_TREND = Array.from({ length: 12 }).map((_, i) => {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
  // light wave around 75-88
  const base = 78 + Math.round(Math.sin(i / 1.7) * 6 + (i / 11) * 4)
  const team = base + Math.round(Math.cos(i / 2.2) * 3)
  return { month: months[i], you: base, team }
})

export const PERFORMANCE_LEADERBOARD = [
  { rank: 1, name: 'Esther Howard',      department: 'Sales',       score: 94, change: '+3' },
  { rank: 2, name: 'Ralph Edwards',      department: 'Engineering', score: 92, change: '+1' },
  { rank: 3, name: 'Jenny Wilson',       department: 'Design',      score: 88, change: '+2' },
  { rank: 4, name: 'Courtney Henry',     department: 'Sales',       score: 87, change: '−1' },
  { rank: 5, name: 'Leslie Alexander',   department: 'Engineering', score: 85, change: '+4' },
  { rank: 6, name: 'Cameron Williamson', department: 'Marketing',   score: 81, change: '0'  },
  { rank: 7, name: 'Wade Warren',        department: 'Marketing',   score: 79, change: '+2' },
  { rank: 8, name: 'Darrell Steward',    department: 'Engineering', score: 76, change: '−2' },
] as const

export const DEPARTMENT_PERFORMANCE = [
  { department: 'Sales',       avg: 90, members: 4, color: 'bg-emerald' },
  { department: 'Engineering', avg: 84, members: 8, color: 'bg-violet' },
  { department: 'Design',      avg: 82, members: 3, color: 'bg-sky' },
  { department: 'Marketing',   avg: 79, members: 5, color: 'bg-coral' },
  { department: 'Operations',  avg: 75, members: 4, color: 'bg-indigo' },
  { department: 'HR',          avg: 70, members: 3, color: 'bg-amber' },
]

export const ACTIVITY = [
  {
    id: '#12345',
    employee: 'Ralph Edwards',
    timestamp: '23 Sep, 10:30 AM',
    activity: 'Submitted weekly report',
    assignedTo: 'John Doe',
    comment: 'Q3 performance summary',
  },
  {
    id: '#12346',
    employee: 'Darrell Steward',
    timestamp: '23 Sep, 11:00 AM',
    activity: 'Updated project status to Active',
    assignedTo: 'Acme team',
    comment: 'Client onboarding',
  },
  {
    id: '#12347',
    employee: 'Jenny Wilson',
    timestamp: '23 Sep, 12:15 PM',
    activity: 'Marked task as completed',
    assignedTo: 'Design squad',
    comment: 'Landing page revision',
  },
  {
    id: '#12348',
    employee: 'Cameron Williamson',
    timestamp: '23 Sep, 02:40 PM',
    activity: 'Logged 6 hours',
    assignedTo: 'Self',
    comment: 'Backend refactor',
  },
  {
    id: '#12349',
    employee: 'Esther Howard',
    timestamp: '23 Sep, 03:55 PM',
    activity: 'Added new task',
    assignedTo: 'Marketing team',
    comment: 'Newsletter draft',
  },
]
