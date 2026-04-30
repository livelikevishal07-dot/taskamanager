-- Officely - admin settings persistence

create table if not exists public.workspace_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  workspace_name text not null default 'Officely',
  owner_name text not null default 'Super Admin',
  timezone text not null default 'Asia/Kolkata',
  week_starts_on text not null default 'Monday'
    check (week_starts_on in ('Sunday','Monday')),
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '18:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_settings_touch on public.workspace_settings;
create trigger workspace_settings_touch before update on public.workspace_settings
  for each row execute function public.touch_updated_at();

insert into public.workspace_settings (
  id,
  workspace_name,
  owner_name,
  timezone,
  week_starts_on,
  working_hours_start,
  working_hours_end
) values (
  '00000000-0000-0000-0000-000000000001',
  'Officely',
  'Super Admin',
  'Asia/Kolkata',
  'Monday',
  '09:00',
  '18:00'
) on conflict (id) do nothing;

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  label text not null,
  hint text,
  email_enabled boolean not null default true,
  app_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_settings_touch on public.notification_settings;
create trigger notification_settings_touch before update on public.notification_settings
  for each row execute function public.touch_updated_at();

insert into public.notification_settings (
  event_key,
  label,
  hint,
  email_enabled,
  app_enabled,
  sort_order
) values
  ('task_assigned', 'Task assigned to me', 'Email + in-app', true, true, 10),
  ('task_due', 'Task deadline approaching', '24h before due', true, true, 20),
  ('mention', 'Mentioned in a comment', 'Real time', false, true, 30),
  ('team_added', 'Added to a team', 'Real time', true, true, 40),
  ('attendance', 'Attendance reminders', 'Daily, 9:30 AM', false, true, 50),
  ('weekly_digest', 'Weekly digest', 'Monday morning', true, false, 60)
on conflict (event_key) do nothing;

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  device text not null,
  location text not null,
  last_seen_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.admin_sessions (device, location, last_seen_at, is_current)
select * from (values
  ('Current browser - Chrome', 'Mumbai, IN', now(), true),
  ('iPhone 15 - Safari', 'Mumbai, IN', now() - interval '2 hours', false),
  ('Windows - Edge', 'Pune, IN', now() - interval '3 days', false)
) as s(device, location, last_seen_at, is_current)
where not exists (select 1 from public.admin_sessions);
