
-- Candidates
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  email text,
  role_target text not null,
  status text not null default 'new',
  score numeric,
  cv_text text,
  cv_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index candidates_owner_idx on public.candidates(owner_id);

alter table public.candidates enable row level security;

create policy "owner read candidates" on public.candidates for select using (auth.uid() = owner_id);
create policy "owner insert candidates" on public.candidates for insert with check (auth.uid() = owner_id);
create policy "owner update candidates" on public.candidates for update using (auth.uid() = owner_id);
create policy "owner delete candidates" on public.candidates for delete using (auth.uid() = owner_id);

-- Interview sessions
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  owner_id uuid not null,
  questions jsonb not null,
  answers jsonb,
  evaluation jsonb,
  score numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index interview_candidate_idx on public.interview_sessions(candidate_id);
alter table public.interview_sessions enable row level security;
create policy "owner read interviews" on public.interview_sessions for select using (auth.uid() = owner_id);
create policy "owner insert interviews" on public.interview_sessions for insert with check (auth.uid() = owner_id);
create policy "owner update interviews" on public.interview_sessions for update using (auth.uid() = owner_id);
create policy "owner delete interviews" on public.interview_sessions for delete using (auth.uid() = owner_id);

-- Test assignments
create table public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  owner_id uuid not null,
  topic text not null,
  questions jsonb not null,
  answers jsonb,
  score numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index test_candidate_idx on public.test_assignments(candidate_id);
alter table public.test_assignments enable row level security;
create policy "owner read tests" on public.test_assignments for select using (auth.uid() = owner_id);
create policy "owner insert tests" on public.test_assignments for insert with check (auth.uid() = owner_id);
create policy "owner update tests" on public.test_assignments for update using (auth.uid() = owner_id);
create policy "owner delete tests" on public.test_assignments for delete using (auth.uid() = owner_id);

-- Updated_at trigger for candidates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_set_updated_at
before update on public.candidates
for each row execute function public.set_updated_at();
