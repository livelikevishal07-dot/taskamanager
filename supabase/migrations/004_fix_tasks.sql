-- Officely · 004 · Fix tasks table (old schema from first attempt)
-- Run this in Supabase SQL editor if tasks/employees pages crash.
-- Safe to re-run — uses DROP ... IF EXISTS and ON CONFLICT DO NOTHING.

-- ── 1. Drop old tables (cascade removes assignments too) ──────────────
drop table if exists public.task_assignments cascade;
drop table if exists public.tasks cascade;

-- ── 2. Recreate tasks with correct schema ────────────────────────────
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  priority     text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  status       text not null default 'todo'
    check (status in ('todo','in_progress','review','done','blocked')),
  deadline     timestamptz,
  company_id   uuid references public.companies(id) on delete set null,
  created_by   uuid references public.employees(id) on delete set null,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tasks_status_idx   on public.tasks (status);
create index tasks_company_idx  on public.tasks (company_id);
create index tasks_deadline_idx on public.tasks (deadline);

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ── 3. Recreate task_assignments ──────────────────────────────────────
create table public.task_assignments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  employee_id  uuid not null references public.employees(id) on delete cascade,
  status       text not null default 'not_started'
    check (status in ('not_started','in_progress','done','blocked')),
  started_at   timestamptz,
  completed_at timestamptz,
  hours_logged numeric(6,2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (task_id, employee_id)
);

create index ta_employee_idx on public.task_assignments (employee_id);
create index ta_task_idx     on public.task_assignments (task_id);
create index ta_status_idx   on public.task_assignments (status);

drop trigger if exists task_assignments_touch on public.task_assignments;
create trigger task_assignments_touch before update on public.task_assignments
  for each row execute function public.touch_updated_at();

-- ── 4. Re-seed tasks ──────────────────────────────────────────────────
with co as (select id, name from public.companies),
     emp as (select id, full_name from public.employees)
insert into public.tasks (title, description, priority, status, deadline, company_id, created_by, completed_at, created_at)
select * from (values
  ('Vendor coordination — Bansal sangeet',  'Lock 4 décor vendors and final headcount.',    'high',   'in_progress', now()+interval '1 day',   (select id from co where name='7eventzz'),     (select id from emp where full_name='Ralph Edwards'),     null,                      now()-interval '4 day'),
  ('Sound check — Mehta wedding',           'Test rig + run rehearsal.',                    'urgent', 'in_progress', now()+interval '14 hour', (select id from co where name='7eventzz'),     (select id from emp where full_name='Ralph Edwards'),     null,                      now()-interval '2 day'),
  ('Vendor onboarding playbook',            'SOP for new décor vendors.',                   'low',    'done',        now()-interval '3 day',   (select id from co where name='7eventzz'),     (select id from emp where full_name='Brooklyn Simmons'),  now()-interval '4 day',    now()-interval '10 day'),
  ('Landing page hero refresh',             'Direction approved — handoff after copy.',     'high',   'review',      now()+interval '2 day',   (select id from co where name='7eventzz'),     (select id from emp where full_name='Jenny Wilson'),      null,                      now()-interval '5 day'),
  ('Anniversary hampers — Vol 4',           'Curate 6 hamper combos under ₹2k.',            'medium', 'in_progress', now()+interval '3 day',   (select id from co where name='Giftlaya'),     (select id from emp where full_name='Jenny Wilson'),      null,                      now()-interval '6 day'),
  ('Bulk corporate quote — Infosys',        'Quote 500 hampers for anniversary.',           'medium', 'review',      now()+interval '4 day',   (select id from co where name='Giftlaya'),     (select id from emp where full_name='Courtney Henry'),    null,                      now()-interval '3 day'),
  ('Diwali catalog photoshoot',             'Day-long shoot at Andheri studio.',            'high',   'done',        now()-interval '7 day',   (select id from co where name='Giftlaya'),     (select id from emp where full_name='Robert Fox'),        now()-interval '8 day',    now()-interval '20 day'),
  ('Instagram reels script — Jan',          '5 reel scripts for arch setups.',              'low',    'todo',        now()+interval '7 day',   (select id from co where name='Balloondekor'), (select id from emp where full_name='Esther Howard'),     null,                      now()-interval '1 day'),
  ('Onboard 2 freelance decorators',        'Brief & contracts for wedding season.',        'medium', 'todo',        now()+interval '8 day',   (select id from co where name='Balloondekor'), (select id from emp where full_name='Kristin Watson'),    null,                      now()-interval '1 day'),
  ('Brand refresh',                         'New palette + typography rollout.',            'low',    'todo',        now()+interval '14 day',  (select id from co where name='Balloondekor'), (select id from emp where full_name='Robert Fox'),        null,                      now()-interval '1 day'),
  ('Showroom inventory audit',              'Count + tag balloon stock.',                   'medium', 'done',        now()-interval '5 day',   (select id from co where name='Balloondekor'), (select id from emp where full_name='Brooklyn Simmons'),  now()-interval '6 day',    now()-interval '12 day'),
  ('Acme growth audit — final deck',        '3 sections still open.',                       'urgent', 'in_progress', now()+interval '6 hour',  (select id from co where name='Clearlevel'),   (select id from emp where full_name='Darrell Steward'),   null,                      now()-interval '8 day'),
  ('Q1 OKRs across companies',              'Final pass with leads before publishing.',     'urgent', 'review',      now()+interval '8 hour',  (select id from co where name='Clearlevel'),   (select id from emp where full_name='Esther Howard'),     null,                      now()-interval '6 day'),
  ('Innov8 quarterly retro',                '45-min retrospective with ops team.',          'medium', 'done',        now()-interval '6 day',   (select id from co where name='Clearlevel'),   (select id from emp where full_name='Wade Warren'),       now()-interval '7 day',    now()-interval '15 day'),
  ('Pricing benchmark — Tier 2 SaaS',       'Pull 12 competitors and segment.',             'medium', 'in_progress', now()+interval '5 day',   (select id from co where name='Clearlevel'),   (select id from emp where full_name='Cameron Williamson'),null,                      now()-interval '3 day')
) as t(title,description,priority,status,deadline,company_id,created_by,completed_at,created_at)
on conflict do nothing;

-- ── 5. Re-seed assignments ────────────────────────────────────────────
with t as (select id, title, status, deadline, completed_at from public.tasks),
     e as (select id, full_name from public.employees),
     pairs as (
  select t.id as task_id, e.id as employee_id, t.status, t.deadline, t.completed_at from t join e on
    (t.title='Vendor coordination — Bansal sangeet' and e.full_name in ('Ralph Edwards','Leslie Alexander')) or
    (t.title='Sound check — Mehta wedding'           and e.full_name in ('Brooklyn Simmons')) or
    (t.title='Vendor onboarding playbook'            and e.full_name in ('Brooklyn Simmons')) or
    (t.title='Landing page hero refresh'             and e.full_name in ('Jenny Wilson','Robert Fox')) or
    (t.title='Anniversary hampers — Vol 4'           and e.full_name in ('Jenny Wilson','Robert Fox')) or
    (t.title='Bulk corporate quote — Infosys'        and e.full_name in ('Courtney Henry','Wade Warren')) or
    (t.title='Diwali catalog photoshoot'             and e.full_name in ('Robert Fox')) or
    (t.title='Instagram reels script — Jan'          and e.full_name in ('Esther Howard')) or
    (t.title='Onboard 2 freelance decorators'        and e.full_name in ('Kristin Watson')) or
    (t.title='Brand refresh'                         and e.full_name in ('Robert Fox','Jenny Wilson')) or
    (t.title='Showroom inventory audit'              and e.full_name in ('Brooklyn Simmons')) or
    (t.title='Acme growth audit — final deck'        and e.full_name in ('Darrell Steward','Leslie Alexander')) or
    (t.title='Q1 OKRs across companies'              and e.full_name in ('Esther Howard','Cameron Williamson')) or
    (t.title='Innov8 quarterly retro'                and e.full_name in ('Wade Warren')) or
    (t.title='Pricing benchmark — Tier 2 SaaS'       and e.full_name in ('Cameron Williamson','Wade Warren'))
)
insert into public.task_assignments (task_id, employee_id, status, started_at, completed_at, hours_logged)
select
  task_id,
  employee_id,
  case
    when status = 'done'        then 'done'
    when status = 'in_progress' then 'in_progress'
    when status = 'review'      then 'in_progress'
    when status = 'blocked'     then 'blocked'
    else 'not_started'
  end,
  case
    when status in ('in_progress','review','done')
      then now() - (random() * interval '5 day' + interval '1 day')
    else null
  end,
  completed_at,
  round((random() * 12 + 1)::numeric, 1)
from pairs
on conflict do nothing;
