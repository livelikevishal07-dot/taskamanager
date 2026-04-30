-- Employee authentication: username + hashed password for the employee portal.
-- Password is stored as a scrypt hash (see lib/auth.ts).

alter table public.employees
  add column if not exists username      text,
  add column if not exists password_hash text;

create unique index if not exists employees_username_key
  on public.employees (lower(username))
  where username is not null;
