create table if not exists public.user_rpg_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  selected_path_id text not null default 'athletics',
  active_mission_id text not null default 'physical-foundation',
  selected_activity_type text not null default 'focused',
  xp_by_node jsonb not null default '{}'::jsonb,
  session_feed jsonb not null default '[]'::jsonb,
  tree_catalog jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_rpg_state
add column if not exists tree_catalog jsonb;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_rpg_state_set_updated_at on public.user_rpg_state;

create trigger user_rpg_state_set_updated_at
before update on public.user_rpg_state
for each row
execute function public.set_updated_at();

alter table public.user_rpg_state enable row level security;

drop policy if exists "Users can read their own RPG state" on public.user_rpg_state;
create policy "Users can read their own RPG state"
on public.user_rpg_state
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own RPG state" on public.user_rpg_state;
create policy "Users can insert their own RPG state"
on public.user_rpg_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own RPG state" on public.user_rpg_state;
create policy "Users can update their own RPG state"
on public.user_rpg_state
for update
using (auth.uid() = user_id);
