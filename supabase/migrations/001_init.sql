-- Officely · initial schema (companies, departments, roles, employees)
-- No RLS for now — server uses the service-role key. Layer auth+RLS later.

-- ── CLEANUP from earlier experiments (idempotent) ──────────────────
-- Drop tables from the old schema if they exist, so this migration can
-- run on a partially-set-up database.
drop table if exists public.task_comments    cascade;
drop table if exists public.task_attachments cascade;
drop table if exists public.task_assignments cascade;
drop table if exists public.tasks            cascade;
drop table if exists public.attendance       cascade;
drop table if exists public.notifications    cascade;
drop table if exists public.profiles         cascade;
drop table if exists public.employees        cascade;
drop table if exists public.departments      cascade;
drop table if exists public.roles            cascade;
drop table if exists public.companies        cascade;

drop type if exists public.user_role     cascade;
drop type if exists public.user_status   cascade;
drop type if exists public.task_priority cascade;
drop type if exists public.task_type     cascade;
drop type if exists public.task_status   cascade;

drop function if exists public.handle_new_user()    cascade;
drop function if exists public.set_updated_at()     cascade;
drop function if exists public.touch_updated_at()   cascade;
drop function if exists public.is_admin()           cascade;
drop function if exists public.is_manager_or_admin() cascade;
drop function if exists public.get_user_role()      cascade;

create extension if not exists pgcrypto;

-- ── COMPANIES ──────────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  industry    text,
  description text,
  color       text not null default 'violet',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── DEPARTMENTS ────────────────────────────────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  lead_name   text,
  color       text not null default 'violet',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── ROLES ──────────────────────────────────────────────────────────
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  color       text not null default 'indigo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── EMPLOYEES ──────────────────────────────────────────────────────
create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text unique,
  phone         text,
  address       text,
  birthday      date,
  joining_date  date,

  role_id       uuid references public.roles(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,

  working_hours_start time,
  working_hours_end   time,
  working_days        smallint[] not null default '{1,2,3,4,5}', -- ISO 1=Mon..7=Sun

  status        text not null default 'active' check (status in ('active','on_leave','inactive')),
  performance   smallint not null default 0 check (performance between 0 and 100),
  avatar_url    text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists employees_role_idx on public.employees (role_id);
create index if not exists employees_dept_idx on public.employees (department_id);
create index if not exists employees_status_idx on public.employees (status);

-- ── updated_at triggers ────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists companies_touch on public.companies;
create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();

drop trigger if exists departments_touch on public.departments;
create trigger departments_touch before update on public.departments
  for each row execute function public.touch_updated_at();

drop trigger if exists roles_touch on public.roles;
create trigger roles_touch before update on public.roles
  for each row execute function public.touch_updated_at();

drop trigger if exists employees_touch on public.employees;
create trigger employees_touch before update on public.employees
  for each row execute function public.touch_updated_at();

-- ── SEED DATA ──────────────────────────────────────────────────────

insert into public.companies (name, slug, industry, description, color) values
  ('7eventzz',     '7eventzz',     'Event management',     'End-to-end event planning, production & on-ground execution.', 'violet'),
  ('Giftlaya',     'giftlaya',     'Gifting & e-commerce', 'Curated personalised gifting for occasions and brands.',       'coral'),
  ('Balloondekor', 'balloondekor', 'Decoration services',  'Balloon styling, themed decor and party setups.',              'sky'),
  ('Clearlevel',   'clearlevel',   'Consulting',           'Operations & growth consulting for early-stage businesses.',   'emerald')
on conflict (name) do nothing;

insert into public.departments (name, description, lead_name, color) values
  ('Engineering', 'Builds and maintains the platform.',             'Ralph Edwards',     'violet'),
  ('Design',      'Brand, product design, and design system.',      'Jenny Wilson',      'sky'),
  ('Marketing',   'Growth, content, and lifecycle.',                'Esther Howard',     'coral'),
  ('Sales',       'Pipeline, AE coverage, and customer expansion.', 'Courtney Henry',    'emerald'),
  ('Operations',  'Vendor management and on-ground execution.',     'Brooklyn Simmons',  'indigo'),
  ('HR',          'Hiring, onboarding, performance, and benefits.', 'Kristin Watson',    'amber')
on conflict (name) do nothing;

insert into public.roles (name, description, color) values
  ('Admin',    'Full access. Manages billing, members, and settings.', 'coral'),
  ('Manager',  'Manages tasks, teams, and reviews their reports.',     'violet'),
  ('Senior',   'Senior IC — can create tasks and review work.',        'indigo'),
  ('Employee', 'Standard access. Updates their own tasks.',            'sky'),
  ('Intern',   'Read-mostly. Limited task assignment.',                'amber')
on conflict (name) do nothing;

insert into public.employees (
  full_name, email, phone, address, joining_date, status, performance,
  role_id, department_id,
  working_hours_start, working_hours_end, working_days
)
values
  ('Ralph Edwards',      'ralph.edwards@officely.io',  '+91 98201 11042', 'Mumbai, IN',     '2022-03-12', 'active',   92,
    (select id from public.roles where name='Manager'),  (select id from public.departments where name='Engineering'), '09:00', '18:00', '{1,2,3,4,5}'),
  ('Jenny Wilson',       'jenny.wilson@officely.io',   '+91 98201 11043', 'Mumbai, IN',     '2022-07-04', 'active',   88,
    (select id from public.roles where name='Senior'),   (select id from public.departments where name='Design'),       '09:00', '18:00', '{1,2,3,4,5}'),
  ('Darrell Steward',    'darrell.s@officely.io',      '+91 98201 11044', 'Pune, IN',       '2023-09-09', 'active',   76,
    (select id from public.roles where name='Employee'), (select id from public.departments where name='Engineering'), '10:00', '19:00', '{1,2,3,4,5}'),
  ('Cameron Williamson', 'cameron.w@officely.io',      '+91 98201 11045', 'Bengaluru, IN',  '2021-01-21', 'on_leave', 81,
    (select id from public.roles where name='Senior'),   (select id from public.departments where name='Marketing'),    '09:00', '18:00', '{1,2,3,4,5}'),
  ('Esther Howard',      'esther.h@officely.io',       '+91 98201 11046', 'Mumbai, IN',     '2023-02-15', 'active',   94,
    (select id from public.roles where name='Manager'),  (select id from public.departments where name='Sales'),        '09:00', '18:00', '{1,2,3,4,5}'),
  ('Brooklyn Simmons',   'brooklyn.s@officely.io',     '+91 98201 11047', 'Mumbai, IN',     '2024-05-08', 'active',   70,
    (select id from public.roles where name='Employee'), (select id from public.departments where name='Operations'),   '09:00', '18:00', '{1,2,3,4,5}'),
  ('Leslie Alexander',   'leslie.a@officely.io',       '+91 98201 11048', 'Delhi, IN',      '2022-11-02', 'active',   85,
    (select id from public.roles where name='Senior'),   (select id from public.departments where name='Engineering'), '09:30', '18:30', '{1,2,3,4,5}'),
  ('Kristin Watson',     'kristin.w@officely.io',      '+91 98201 11049', 'Mumbai, IN',     '2023-08-17', 'inactive', 62,
    (select id from public.roles where name='Employee'), (select id from public.departments where name='HR'),           '10:00', '19:00', '{1,2,3,4,5}'),
  ('Robert Fox',         'robert.fox@officely.io',     '+91 98201 11050', 'Pune, IN',       '2024-10-01', 'active',   58,
    (select id from public.roles where name='Intern'),   (select id from public.departments where name='Design'),       '10:00', '17:00', '{1,2,3,4,5}'),
  ('Wade Warren',        'wade.w@officely.io',         '+91 98201 11051', 'Mumbai, IN',     '2023-06-11', 'active',   79,
    (select id from public.roles where name='Employee'), (select id from public.departments where name='Marketing'),    '09:00', '18:00', '{1,2,3,4,5}'),
  ('Courtney Henry',     'courtney.h@officely.io',     '+91 98201 11052', 'Bengaluru, IN',  '2022-04-26', 'on_leave', 87,
    (select id from public.roles where name='Senior'),   (select id from public.departments where name='Sales'),        '09:00', '18:00', '{1,2,3,4,5}'),
  ('Jacob Jones',        'jacob.jones@officely.io',    '+91 98201 11053', 'Mumbai, IN',     '2024-03-03', 'active',   73,
    (select id from public.roles where name='Employee'), (select id from public.departments where name='Engineering'), '09:00', '18:00', '{1,2,3,4,5}')
on conflict (email) do nothing;
