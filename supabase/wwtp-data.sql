-- WWTP Tasks cloud data. Run once in Supabase Dashboard > SQL Editor > New query
-- (same Supabase project as Grounds Up; this only adds a new table).
-- One row per user holding the whole app data as JSON. The app checks the fingerprint and saved_at to tell
-- which device changed what.

create table if not exists public.wwtp_data (
  user_id     uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb       not null check (octet_length(data::text) <= 5000000),
  fingerprint text        not null default '',
  saved_at    timestamptz not null,
  device      text        not null default '' check (char_length(device) <= 40),
  updated_at  timestamptz not null default now()
);

-- Each user sees and changes only their own row. Signed-out visitors (the anon role) get nothing.
alter table public.wwtp_data enable row level security;
revoke all on public.wwtp_data from anon;
grant select, insert, update, delete on public.wwtp_data to authenticated;

drop policy if exists "Users read their own WWTP data" on public.wwtp_data;
create policy "Users read their own WWTP data" on public.wwtp_data
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users add their own WWTP data" on public.wwtp_data;
create policy "Users add their own WWTP data" on public.wwtp_data
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own WWTP data" on public.wwtp_data;
create policy "Users update their own WWTP data" on public.wwtp_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own WWTP data" on public.wwtp_data;
create policy "Users delete their own WWTP data" on public.wwtp_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- updated_at is set by the database on every write.
create or replace function public.wwtp_data_touch() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists wwtp_data_touch on public.wwtp_data;
create trigger wwtp_data_touch before insert or update on public.wwtp_data
  for each row execute function public.wwtp_data_touch();
