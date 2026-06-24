create table if not exists public.projects (
  id text primary key,
  resume_data jsonb not null,
  conversation jsonb not null default '[]'::jsonb,
  portfolio_ready boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "service_role_full_access"
on public.projects
for all
to service_role
using (true)
with check (true);
